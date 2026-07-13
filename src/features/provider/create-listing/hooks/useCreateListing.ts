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
import { publishSchema } from "../schemas/listing-schemas";
import type {
  DepositMonths,
  ListingDraft,
  ListingDraftErrors,
} from "./useListingDraft";
import { INITIAL_DRAFT } from "./useListingDraft";

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

function toPositiveNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toOptionalPositiveNumber(value: string): number | undefined {
  const n = parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function toOptionalNonNegativeNumber(value: string): number | undefined {
  const n = parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function calculateDeposit(
  coldRent: number | undefined,
  months: DepositMonths,
): number | undefined {
  if (coldRent === undefined || coldRent <= 0) return undefined;
  return coldRent * months;
}

function toObjectType(value: string): ObjectTypeBackend {
  if (value === "wohnung") return "APARTMENT";
  if (value === "haus") return "HOUSE";
  if (value === "zimmer") return "ROOM";
  return "APARTMENT";
}

function toPetsPolicy(value: string): PetPolicyBackend | undefined {
  if (value === "erlaubt") return "ALLOWED";
  if (value === "absprache") return "BY_ARRANGEMENT";
  if (value === "keine") return "PREFER_NOT";
  return undefined;
}

function toSmokingPolicy(value: string): SmokingPolicyBackend | undefined {
  if (value === "erlaubt") return "ALLOWED";
  if (value === "absprache") return "BY_ARRANGEMENT";
  if (value === "nichtraucher") return "NON_SMOKERS_PREFERRED";
  return undefined;
}

function toRequirement(value: string): boolean {
  return value === "erforderlich";
}

function toRooms(value: string): number {
  if (value === "6+") return 6;
  return toPositiveNumber(value);
}

function toOptionalRooms(value: string): number | undefined {
  if (value === "6+") return 6;
  return toOptionalPositiveNumber(value);
}

function toSuitableForPeopleCount(
  adults: number | null,
  kids: number | null,
): number | null {
  const total = (adults ?? 0) + (kids ?? 0);
  return total > 0 ? total : null;
}

function toOptionalIsoDate(value: string): string | undefined {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return undefined;
  const [, yearValue, monthValue, dayValue] = match;
  if (!yearValue || !monthValue || !dayValue) return undefined;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return date.toISOString();
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function hasMeaningfulDraftContent(draft: ListingDraft): boolean {
  return (
    hasText(draft.city) ||
    hasText(draft.zip) ||
    hasText(draft.street) ||
    draft.objectType !== INITIAL_DRAFT.objectType ||
    toOptionalPositiveNumber(draft.area) !== undefined ||
    toOptionalRooms(draft.rooms) !== undefined ||
    draft.bedrooms !== null ||
    toOptionalPositiveNumber(draft.price) !== undefined ||
    toOptionalNonNegativeNumber(draft.additionalCosts) !== undefined ||
    toOptionalIsoDate(draft.availableFrom) !== undefined ||
    hasText(draft.titleOverride) ||
    hasText(draft.description) ||
    draft.photos.length > 0 ||
    toOptionalPositiveNumber(draft.minIncome) !== undefined ||
    draft.schufa !== INITIAL_DRAFT.schufa ||
    draft.income !== INITIAL_DRAFT.income ||
    (draft.adults !== null && draft.adults > 0) ||
    (draft.kids !== null && draft.kids > 0) ||
    draft.pets !== INITIAL_DRAFT.pets ||
    draft.smoking !== INITIAL_DRAFT.smoking
  );
}

function mapDraftToCreateListingDto(
  draft: ListingDraft,
  title: string,
): CreateListingPayload {
  const coldRent = toPositiveNumber(draft.price);
  const deposit = calculateDeposit(coldRent, draft.depositMonths);

  return {
    city: draft.city.trim(),
    zip: draft.zip.trim(),
    street: draft.street.trim() || undefined,
    showExactAddress: !draft.hideAddress,
    objectType: toObjectType(draft.objectType),
    livingArea: toPositiveNumber(draft.area),
    rooms: toRooms(draft.rooms),
    bedrooms: draft.bedrooms,
    coldRent,
    additionalCosts:
      draft.additionalCosts.length > 0
        ? toPositiveNumber(draft.additionalCosts)
        : undefined,
    depositMonths: draft.depositMonths,
    deposit,
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

type MutableCreateListingPayload = {
  -readonly [K in keyof CreateListingPayload]: CreateListingPayload[K];
};

function mapDraftToPartialCreateListingDto(
  draft: ListingDraft,
  title: string,
): CreateListingPayload {
  const payload: MutableCreateListingPayload = {
    objectType: toObjectType(draft.objectType),
  };
  const city = draft.city.trim();
  const zip = draft.zip.trim();
  const street = draft.street.trim();
  const livingArea = toOptionalPositiveNumber(draft.area);
  const rooms = toOptionalRooms(draft.rooms);
  const coldRent = toOptionalPositiveNumber(draft.price);
  const additionalCosts = toOptionalNonNegativeNumber(draft.additionalCosts);
  const deposit = calculateDeposit(coldRent, draft.depositMonths);
  const availableFrom = toOptionalIsoDate(draft.availableFrom);
  const trimmedTitle = title.trim();
  const shortDescription = draft.description.trim();
  const minimumHouseholdNetIncome = toOptionalPositiveNumber(draft.minIncome);
  const suitableForPeopleCount = toSuitableForPeopleCount(
    draft.adults,
    draft.kids,
  );

  if (city) payload.city = city;
  if (zip) payload.zip = zip;
  if (street) payload.street = street;
  if (street || draft.hideAddress !== INITIAL_DRAFT.hideAddress) {
    payload.showExactAddress = !draft.hideAddress;
  }
  if (livingArea !== undefined) payload.livingArea = livingArea;
  if (rooms !== undefined) payload.rooms = rooms;
  if (draft.bedrooms !== null) payload.bedrooms = draft.bedrooms;
  if (coldRent !== undefined) payload.coldRent = coldRent;
  if (additionalCosts !== undefined) payload.additionalCosts = additionalCosts;
  if (deposit !== undefined) {
    payload.depositMonths = draft.depositMonths;
    payload.deposit = deposit;
  }
  if (availableFrom !== undefined) payload.availableFrom = availableFrom;
  if (trimmedTitle && hasMeaningfulDraftContent(draft)) {
    payload.title = trimmedTitle;
  }
  if (shortDescription) payload.shortDescription = shortDescription;
  if (minimumHouseholdNetIncome !== undefined) {
    payload.minimumHouseholdNetIncome = minimumHouseholdNetIncome;
  }
  if (draft.schufa !== INITIAL_DRAFT.schufa) {
    payload.schufaRequired = toRequirement(draft.schufa);
  }
  if (draft.income !== INITIAL_DRAFT.income) {
    payload.incomeProofRequired = toRequirement(draft.income);
  }
  if (suitableForPeopleCount !== null) {
    payload.suitableForPeopleCount = suitableForPeopleCount;
  }
  if (draft.pets !== INITIAL_DRAFT.pets) {
    const petsPolicy = toPetsPolicy(draft.pets);
    if (petsPolicy !== undefined) payload.petsPolicy = petsPolicy;
  }
  if (draft.smoking !== INITIAL_DRAFT.smoking) {
    const smokingPolicy = toSmokingPolicy(draft.smoking);
    if (smokingPolicy !== undefined) payload.smokingPolicy = smokingPolicy;
  }

  return payload;
}

function createDraftFromListingDraft(
  draft: ListingDraft,
  title: string,
): Promise<{ readonly id: string }> {
  const payload = mapDraftToCreateListingDto(draft, title);
  const file = draft.photos[0]?.file;
  return file ? createListingDraft(payload, file) : createListingDraft(payload);
}

function savePartialDraftFromListingDraft(
  draft: ListingDraft,
  title: string,
): Promise<{ readonly id: string }> {
  const payload = mapDraftToPartialCreateListingDto(draft, title);
  const file = draft.photos[0]?.file;
  return file ? createListingDraft(payload, file) : createListingDraft(payload);
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
    "depositMonths",
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
  if (/depositMonths|deposit/i.test(message))
    errors.depositMonths = "Bitte wähle eine gültige Kaution";
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

  const saveDraft = useCallback(
    async (draft: ListingDraft, title: string, options?: SaveDraftOptions) => {
      const redirectTo = options?.redirectTo ?? "/provider/listings";
      if (draftIdRef.current) {
        if (redirectTo) router.push(redirectTo);
        return "saved";
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
        const created = await savePartialDraftFromListingDraft(draft, title);
        draftIdRef.current = created.id;
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
        if (!id) {
          const created = await createDraftFromListingDraft(draft, title);
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
