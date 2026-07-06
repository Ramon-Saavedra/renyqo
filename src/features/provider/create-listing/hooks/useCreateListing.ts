"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  createListingDraft,
  publishListing,
  type CreateListingPayload,
  type ObjectTypeBackend,
  type PetPolicyBackend,
  type SmokingPolicyBackend,
} from "@/lib/api/listings";
import { draftSaveSchema, publishSchema } from "../schemas/listing-schemas";
import type { ListingDraft, ListingDraftErrors } from "./useListingDraft";

export type SubmitStatus = "idle" | "saving" | "publishing";

export interface UseCreateListingResult {
  readonly submitStatus: SubmitStatus;
  readonly error: string | null;
  readonly fieldErrors: ListingDraftErrors;
  readonly saveDraft: (draft: ListingDraft, title: string) => Promise<void>;
  readonly publish: (draft: ListingDraft, title: string) => Promise<void>;
  readonly clearFieldError: (key: keyof ListingDraftErrors) => void;
}

function toPositiveNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toObjectType(value: string): ObjectTypeBackend {
  if (value === "wohnung") return "APARTMENT";
  if (value === "haus") return "HOUSE";
  if (value === "zimmer") return "ROOM";
  return "APARTMENT";
}

function toPetsPolicy(value: string): PetPolicyBackend {
  if (value === "erlaubt") return "ALLOWED";
  if (value === "keine") return "PREFER_NOT";
  return "BY_ARRANGEMENT";
}

function toSmokingPolicy(value: string): SmokingPolicyBackend {
  if (value === "erlaubt") return "ALLOWED";
  if (value === "keine") return "PREFER_NOT";
  return "BY_ARRANGEMENT";
}

function toRequirement(value: string): boolean {
  return value === "erforderlich";
}

function toRooms(value: string): number {
  if (value === "6+") return 6;
  return toPositiveNumber(value);
}

function toSuitableForPeopleCount(
  adults: number | null,
  kids: number | null,
): number | null {
  const total = (adults ?? 0) + (kids ?? 0);
  return total > 0 ? total : null;
}

function mapDraftToCreateListingDto(
  draft: ListingDraft,
  title: string,
): CreateListingPayload {
  return {
    city: draft.city.trim(),
    zip: draft.zip.trim(),
    street: draft.street.trim() || undefined,
    showExactAddress: !draft.hideAddress,
    objectType: toObjectType(draft.objectType),
    livingArea: toPositiveNumber(draft.area),
    rooms: toRooms(draft.rooms),
    bedrooms: draft.bedrooms,
    coldRent: toPositiveNumber(draft.price),
    additionalCosts:
      draft.additionalCosts.length > 0
        ? toPositiveNumber(draft.additionalCosts)
        : undefined,
    deposit:
      draft.deposit.length > 0 ? toPositiveNumber(draft.deposit) : undefined,
    availableFrom: draft.availableFrom,
    title: title.trim(),
    shortDescription: draft.description.trim(),
    minimumHouseholdNetIncome: draft.minIncome
      ? toPositiveNumber(draft.minIncome)
      : null,
    schufaRequired: toRequirement(draft.schufa),
    incomeProofRequired: toRequirement(draft.income),
    suitableForPeopleCount: toSuitableForPeopleCount(draft.adults, draft.kids),
    petsPolicy: toPetsPolicy(draft.pets),
    smokingPolicy: toSmokingPolicy(draft.smoking),
  };
}

type ZodFlatErrors = Record<string, string[] | undefined>;

function mapZodErrors(flat: ZodFlatErrors): ListingDraftErrors {
  const errors: ListingDraftErrors = {};
  const keys = [
    "city",
    "zip",
    "street",
    "area",
    "rooms",
    "bedrooms",
    "price",
    "additionalCosts",
    "deposit",
    "availableFrom",
    "legalAccepted",
  ] as const;
  for (const key of keys) {
    const first = flat[key]?.[0];
    if (first) errors[key] = first;
  }
  return errors;
}

function mapBackendMessage(message: string): ListingDraftErrors {
  const errors: ListingDraftErrors = {};
  if (/\bcity\b/i.test(message)) errors.city = "Bitte gib eine Stadt an";
  if (/\bzip\b/i.test(message)) errors.zip = "Bitte gib die Postleitzahl an";
  if (/\bstreet\b/i.test(message)) errors.street = "Bitte gib die Straße an";
  if (/livingArea|area/i.test(message))
    errors.area = "Bitte gib die Wohnfläche an";
  if (/coldRent|rent/i.test(message))
    errors.price = "Bitte gib die Kaltmiete an";
  if (/\brooms\b/i.test(message)) errors.rooms = "Bitte wähle die Zimmeranzahl";
  if (/\bbedrooms\b/i.test(message))
    errors.bedrooms = "Bitte gib die Anzahl der Schlafzimmer an";
  if (/availableFrom/i.test(message))
    errors.availableFrom = "Bitte wähle ein gültiges Datum";
  return errors;
}

function hasErrors(errors: ListingDraftErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function useCreateListing(): UseCreateListingResult {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ListingDraftErrors>({});
  const draftIdRef = useRef<string | null>(null);

  const clearFieldError = useCallback((key: keyof ListingDraftErrors) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const saveDraft = useCallback(async (draft: ListingDraft, title: string) => {
    if (draftIdRef.current) return;
    setError(null);
    const result = draftSaveSchema.safeParse(draft);
    if (!result.success) {
      setFieldErrors(mapZodErrors(result.error.flatten().fieldErrors));
      return;
    }
    setFieldErrors({});
    setSubmitStatus("saving");
    try {
      const created = await createListingDraft(
        mapDraftToCreateListingDto(draft, title),
      );
      draftIdRef.current = created.id;
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
    } finally {
      setSubmitStatus("idle");
    }
  }, []);

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
        if (!id) {
          const created = await createListingDraft(
            mapDraftToCreateListingDto(draft, title),
          );
          id = created.id;
          draftIdRef.current = id;
        }
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
