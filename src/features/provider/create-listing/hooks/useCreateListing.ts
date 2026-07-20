"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  createListingDraft,
  publishListing,
  updateListing,
} from "@/lib/api/listings";
import { publishSchema } from "../schemas/listing-schemas";
import {
  hasErrors,
  mapBackendMessage,
  mapZodErrors,
} from "./listingErrorMapping";
import {
  getListingPhotoFiles,
  uploadPendingListingImages,
} from "./listingImageUploads";
import {
  hasMeaningfulDraftContent,
  mapCreateListingPayloadToUpdatePayload,
  mapDraftToCreateListingDto,
  mapDraftToPartialCreateListingDto,
} from "./listingPayload";
import type { ListingDraft, ListingDraftErrors } from "./useListingDraft";

export { hasMeaningfulDraftContent } from "./listingPayload";

export type SubmitStatus = "idle" | "saving" | "publishing";
export type DraftSaveResult = "saved" | "empty" | "error";

export interface SaveDraftOptions {
  readonly redirectTo?: string | false;
}

export interface UseCreateListingResult {
  readonly submitStatus: SubmitStatus;
  readonly error: string | null;
  readonly fieldErrors: ListingDraftErrors;
  readonly saveDraft: (
    draft: ListingDraft,
    title: string,
    options?: SaveDraftOptions,
  ) => Promise<DraftSaveResult>;
  readonly publish: (draft: ListingDraft, title: string) => Promise<void>;
  readonly clearFieldError: (key: keyof ListingDraftErrors) => void;
}

const EMPTY_DRAFT_MESSAGE = "Es gibt noch nichts zu speichern.";

function createDraftFromListingDraft(
  draft: ListingDraft,
  title: string,
  file?: File,
): Promise<{ readonly id: string }> {
  const payload = mapDraftToCreateListingDto(draft, title);
  return file ? createListingDraft(payload, file) : createListingDraft(payload);
}

function savePartialDraftFromListingDraft(
  draft: ListingDraft,
  title: string,
  file?: File,
): Promise<{ readonly id: string }> {
  const payload = mapDraftToPartialCreateListingDto(draft, title);
  return file ? createListingDraft(payload, file) : createListingDraft(payload);
}

export function useCreateListing(): UseCreateListingResult {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ListingDraftErrors>({});
  const draftIdRef = useRef<string | null>(null);
  const uploadedPhotoIdsRef = useRef<Set<string>>(new Set());

  const clearFieldError = useCallback((key: keyof ListingDraftErrors) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const saveDraft = useCallback(
    async (draft: ListingDraft, title: string, options?: SaveDraftOptions) => {
      const redirectTo = options?.redirectTo ?? "/provider/listings";
      if (draftIdRef.current) {
        setError(null);
        setFieldErrors({});
        setSubmitStatus("saving");
        try {
          await updateListing(
            draftIdRef.current,
            mapCreateListingPayloadToUpdatePayload(
              mapDraftToPartialCreateListingDto(draft, title),
            ),
          );
          await uploadPendingListingImages(
            draftIdRef.current,
            getListingPhotoFiles(draft),
            uploadedPhotoIdsRef.current,
          );
          if (redirectTo) router.push(redirectTo);
          return "saved";
        } catch (err) {
          if (err instanceof ApiError && err.status === 400) {
            const mapped = mapBackendMessage(err.message);
            if (hasErrors(mapped)) {
              setFieldErrors(mapped);
            } else {
              setError("Bitte prüfe deine Eingaben");
            }
          } else if (err instanceof ApiError && err.status === 0) {
            setError("Netzwerkfehler — bitte versuche es erneut");
          } else {
            setError("Fehler beim Speichern");
          }
          return "error";
        } finally {
          setSubmitStatus("idle");
        }
      }

      setError(null);
      if (!hasMeaningfulDraftContent(draft)) {
        setFieldErrors({});
        setError(EMPTY_DRAFT_MESSAGE);
        return "empty";
      }
      setFieldErrors({});
      setSubmitStatus("saving");
      try {
        const photoFiles = getListingPhotoFiles(draft);
        const firstPhoto = photoFiles[0];
        const created = await savePartialDraftFromListingDraft(
          draft,
          title,
          firstPhoto?.file,
        );
        draftIdRef.current = created.id;
        if (firstPhoto) uploadedPhotoIdsRef.current.add(firstPhoto.id);
        await uploadPendingListingImages(
          created.id,
          photoFiles,
          uploadedPhotoIdsRef.current,
        );
        if (redirectTo) router.push(redirectTo);
        return "saved";
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          const mapped = mapBackendMessage(err.message);
          if (hasErrors(mapped)) {
            setFieldErrors(mapped);
          } else {
            setError("Bitte prüfe deine Eingaben");
          }
        } else if (err instanceof ApiError && err.status === 0) {
          setError("Netzwerkfehler — bitte versuche es erneut");
        } else {
          setError("Fehler beim Speichern");
        }
        return "error";
      } finally {
        setSubmitStatus("idle");
      }
    },
    [router],
  );

  const publish = useCallback(
    async (draft: ListingDraft, title: string) => {
      setError(null);
      const result = publishSchema.safeParse(draft);
      if (!result.success) {
        setFieldErrors(mapZodErrors(result.error.flatten().fieldErrors));
        return;
      }
      setFieldErrors({});
      setSubmitStatus("publishing");
      try {
        let id = draftIdRef.current;
        const photoFiles = getListingPhotoFiles(draft);
        const firstPhoto = photoFiles[0];
        if (!id) {
          const created = await createDraftFromListingDraft(
            draft,
            title,
            firstPhoto?.file,
          );
          id = created.id;
          draftIdRef.current = id;
          if (firstPhoto) uploadedPhotoIdsRef.current.add(firstPhoto.id);
        } else {
          await updateListing(
            id,
            mapCreateListingPayloadToUpdatePayload(
              mapDraftToCreateListingDto(draft, title),
            ),
          );
        }
        await uploadPendingListingImages(
          id,
          photoFiles,
          uploadedPhotoIdsRef.current,
        );
        await publishListing(id);
        router.push("/provider/listings");
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          const mapped = mapBackendMessage(err.message);
          if (hasErrors(mapped)) {
            setFieldErrors(mapped);
          } else {
            setError("Bitte prüfe deine Eingaben");
          }
        } else if (err instanceof ApiError && err.status === 401) {
          setError("Nicht autorisiert — bitte melde dich erneut an");
        } else if (err instanceof ApiError && err.status === 0) {
          setError("Netzwerkfehler — bitte versuche es erneut");
        } else {
          setError("Fehler beim Veröffentlichen");
        }
        setSubmitStatus("idle");
      }
    },
    [router],
  );

  return {
    submitStatus,
    error,
    fieldErrors,
    saveDraft,
    publish,
    clearFieldError,
  };
}
