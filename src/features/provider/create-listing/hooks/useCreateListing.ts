"use client";
import type { ApiRequestOptions } from "@/lib/api/client";
import { useOptionalProviderWorkspace } from "@/features/provider/workspaces/scope-context";

import { useCallback, useRef, useState } from "react";
import { useProviderRouter as useRouter } from "@/features/provider/workspaces/use-provider-router";
import { ApiError } from "@/lib/api/client";
import {
  createListingDraft,
  publishListing,
  updateListing,
} from "@/lib/api/listings";
import { publishSchema } from "../schemas/listing-schemas";
import { createListingCopy } from "../copy/create-listing";
import { isBedroomRoomRelationshipValid } from "../utils/listing-validation";
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
  commandId: string,
  providerOptions?: ApiRequestOptions,
) {
  return createListingDraft(
    { ...mapDraftToCreateListingDto(draft, title), commandId },
    providerOptions,
  );
}
function savePartialDraftFromListingDraft(
  draft: ListingDraft,
  title: string,
  commandId: string,
  providerOptions?: ApiRequestOptions,
) {
  return createListingDraft(
    { ...mapDraftToPartialCreateListingDto(draft, title), commandId },
    providerOptions,
  );
}

export function useCreateListing(): UseCreateListingResult {
  const providerOptions = useOptionalProviderWorkspace()?.requestOptions;
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ListingDraftErrors>({});
  const draftIdRef = useRef<string | null>(null);
  const commandIdRef = useRef<string | null>(null);
  const createCommandId = useCallback(
    () => commandIdRef.current ?? (commandIdRef.current = crypto.randomUUID()),
    [],
  );
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

      // Cross-field: block the save when bedrooms exceeds rooms.
      if (!isBedroomRoomRelationshipValid(draft.rooms, draft.bedrooms)) {
        setFieldErrors({
          bedrooms: createListingCopy.validation.bedroomsTooMany,
        });
        return "error";
      }

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
            providerOptions,
          );
          await uploadPendingListingImages(
            draftIdRef.current,
            getListingPhotoFiles(draft),
            uploadedPhotoIdsRef.current,
            providerOptions,
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
        const created = await savePartialDraftFromListingDraft(
          draft,
          title,
          createCommandId(),
          providerOptions,
        );
        draftIdRef.current = created.id;
        await uploadPendingListingImages(
          created.id,
          photoFiles,
          uploadedPhotoIdsRef.current,
          providerOptions,
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
    [router, providerOptions, createCommandId],
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
        if (!id) {
          const created = await createDraftFromListingDraft(
            draft,
            title,
            createCommandId(),
            providerOptions,
          );
          id = created.id;
          draftIdRef.current = id;
        } else {
          await updateListing(
            id,
            mapCreateListingPayloadToUpdatePayload(
              mapDraftToCreateListingDto(draft, title),
            ),
            providerOptions,
          );
        }
        await uploadPendingListingImages(
          id,
          photoFiles,
          uploadedPhotoIdsRef.current,
          providerOptions,
        );
        await publishListing(id, providerOptions);
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
    [router, providerOptions, createCommandId],
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
