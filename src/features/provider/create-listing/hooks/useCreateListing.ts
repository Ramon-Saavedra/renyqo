"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  createListingDraft,
  publishListing,
  type CreateListingPayload,
} from "@/lib/api/listings";
import type { ListingDraft } from "./useListingDraft";

export type SubmitStatus = "idle" | "saving" | "publishing";

export interface UseCreateListingResult {
  readonly submitStatus: SubmitStatus;
  readonly error: string | null;
  readonly saveDraft: (draft: ListingDraft, title: string) => Promise<void>;
  readonly publish: (draft: ListingDraft, title: string) => Promise<void>;
}

function toPositiveNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function mapDraftToPayload(
  draft: ListingDraft,
  title: string,
): CreateListingPayload {
  const objectTypeMap: Record<string, CreateListingPayload["objectType"]> = {
    wohnung: "APARTMENT",
    haus: "HOUSE",
    zimmer: "ROOM",
  };
  const petMap: Record<string, CreateListingPayload["petsPolicy"]> = {
    erlaubt: "ALLOWED",
    absprache: "BY_ARRANGEMENT",
    keine: "PREFER_NOT",
  };
  const smokingMap: Record<string, CreateListingPayload["smokingPolicy"]> = {
    erlaubt: "ALLOWED",
    absprache: "BY_ARRANGEMENT",
  };

  const rooms = draft.rooms === "6+" ? 6 : toPositiveNumber(draft.rooms);
  const total = (draft.adults ?? 0) + (draft.kids ?? 0);

  return {
    address: draft.address.trim(),
    showExactAddress: !draft.hideAddress,
    objectType: objectTypeMap[draft.objectType] ?? "APARTMENT",
    livingArea: toPositiveNumber(draft.area),
    rooms,
    bedrooms: draft.bedrooms,
    coldRent: toPositiveNumber(draft.price),
    availableFrom: draft.availableFrom,
    title: title.trim(),
    shortDescription: draft.description.trim(),
    minimumHouseholdNetIncome: draft.minIncome
      ? toPositiveNumber(draft.minIncome)
      : null,
    schufaRequired: draft.schufa === "erforderlich",
    incomeProofRequired: draft.income === "erforderlich",
    suitableForPeopleCount: total > 0 ? total : null,
    petsPolicy: petMap[draft.pets] ?? "BY_ARRANGEMENT",
    smokingPolicy: smokingMap[draft.smoking] ?? "BY_ARRANGEMENT",
  };
}

export function useCreateListing(): UseCreateListingResult {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const draftIdRef = useRef<string | null>(null);

  const saveDraft = useCallback(
    async (draft: ListingDraft, title: string) => {
      if (draftIdRef.current) return;
      setError(null);
      setSubmitStatus("saving");
      try {
        const result = await createListingDraft(mapDraftToPayload(draft, title));
        draftIdRef.current = result.id;
      } catch (err) {
        setError(
          err instanceof ApiError && err.message
            ? err.message
            : "Fehler beim Speichern",
        );
      } finally {
        setSubmitStatus("idle");
      }
    },
    [],
  );

  const publish = useCallback(
    async (draft: ListingDraft, title: string) => {
      setError(null);
      setSubmitStatus("publishing");
      try {
        let id = draftIdRef.current;
        if (!id) {
          const result = await createListingDraft(
            mapDraftToPayload(draft, title),
          );
          id = result.id;
          draftIdRef.current = id;
        }
        await publishListing(id);
        router.push("/provider/listings");
      } catch (err) {
        setError(
          err instanceof ApiError && err.message
            ? err.message
            : "Fehler beim Veröffentlichen",
        );
        setSubmitStatus("idle");
      }
    },
    [router],
  );

  return { submitStatus, error, saveDraft, publish };
}
