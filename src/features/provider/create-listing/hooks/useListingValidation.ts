import { useMemo } from "react";
import { createListingCopy } from "../copy/create-listing";
import type { ListingDraft } from "./useListingDraft";

export interface ListingValidationResult {
  readonly missing: ReadonlyArray<string>;
  readonly canPublish: boolean;
  readonly completedSteps: ReadonlyArray<string>;
}

export function useListingValidation(
  draft: ListingDraft,
): ListingValidationResult {
  return useMemo(() => {
    const labels = createListingCopy.missingLabels;
    const missing: string[] = [];
    if (!draft.address.trim()) missing.push(labels.address);
    if (!draft.area) missing.push(labels.area);
    if (!draft.rooms) missing.push(labels.rooms);
    if (!draft.price) missing.push(labels.price);
    if (!draft.availableFrom) missing.push(labels.availableFrom);
    if (draft.photos.length < 1) missing.push(labels.photo);
    if (!draft.legalAccepted) missing.push(labels.legal);

    const canPublish = missing.length === 0;
    const completedSteps: string[] = [];
    if (
      draft.address &&
      draft.area &&
      draft.rooms &&
      draft.price &&
      draft.availableFrom
    ) {
      completedSteps.push("sec-01");
    }
    if (draft.adults !== null && draft.adults >= 1) {
      completedSteps.push("sec-02");
    }
    if (draft.legalAccepted) {
      completedSteps.push("sec-03");
    }

    return { missing, canPublish, completedSteps };
  }, [draft]);
}
