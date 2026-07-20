import { useMemo } from "react";
import { createListingCopy } from "../copy/create-listing";
import {
  isPositiveListingNumber,
  isValidListingDate,
} from "../utils/listing-validation";
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
    if (!draft.city.trim()) missing.push(labels.city);
    if (!draft.zip.trim()) missing.push(labels.zip);
    if (!draft.street.trim()) missing.push(labels.street);
    if (!isPositiveListingNumber(draft.area)) missing.push(labels.area);
    if (draft.rooms !== "6+" && !isPositiveListingNumber(draft.rooms)) {
      missing.push(labels.rooms);
    }
    if (draft.bedrooms === null || draft.bedrooms < 0) {
      missing.push(labels.bedrooms);
    }
    if (!isPositiveListingNumber(draft.price)) missing.push(labels.price);
    if (!isValidListingDate(draft.availableFrom)) {
      missing.push(labels.availableFrom);
    }
    if (!draft.legalAccepted) missing.push(labels.legal);

    const canPublish = missing.length === 0;
    const completedSteps: string[] = [];
    if (
      draft.city &&
      draft.zip &&
      draft.street &&
      isPositiveListingNumber(draft.area) &&
      (draft.rooms === "6+" || isPositiveListingNumber(draft.rooms)) &&
      draft.bedrooms !== null &&
      draft.bedrooms >= 0 &&
      isPositiveListingNumber(draft.price) &&
      isValidListingDate(draft.availableFrom)
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
