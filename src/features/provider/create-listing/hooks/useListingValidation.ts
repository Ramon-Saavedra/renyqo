import { useMemo } from "react";
import { createListingCopy } from "../copy/create-listing";
import {
  isPositiveListingNumber,
  isValidListingDate,
} from "../utils/listing-validation";
import type { ListingDraft } from "./useListingDraft";
import { INITIAL_DRAFT } from "./useListingDraft";

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
    if (!isPositiveListingNumber(draft.rooms)) {
      missing.push(labels.rooms);
    }
    if (!draft.bedrooms) {
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
      isPositiveListingNumber(draft.rooms) &&
      draft.bedrooms !== "" &&
      isPositiveListingNumber(draft.price) &&
      isValidListingDate(draft.availableFrom)
    ) {
      completedSteps.push("sec-01");
    }
    if (
      draft.minIncome.trim().length > 0 ||
      draft.peopleCount !== null ||
      draft.schufa !== INITIAL_DRAFT.schufa ||
      draft.income !== INITIAL_DRAFT.income ||
      draft.pets !== INITIAL_DRAFT.pets ||
      draft.smoking !== INITIAL_DRAFT.smoking
    ) {
      completedSteps.push("sec-02");
    }
    if (draft.legalAccepted) {
      completedSteps.push("sec-03");
    }

    return { missing, canPublish, completedSteps };
  }, [draft]);
}
