import type { UpdateListingPayload } from "@/lib/api/listings";
import type { ListingEditForm } from "./types";

type MutablePayload = {
  -readonly [K in keyof UpdateListingPayload]: UpdateListingPayload[K];
};

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
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

/**
 * Builds a PATCH payload containing only the fields that changed relative to
 * the originally loaded form, so the update request stays minimal.
 */
export function mapEditFormToUpdatePayload(
  form: ListingEditForm,
  initial: ListingEditForm,
): UpdateListingPayload {
  const payload: MutablePayload = {};

  if (form.title !== initial.title) {
    const title = form.title.trim();
    if (title) payload.title = title;
  }
  if (form.objectType !== initial.objectType) {
    payload.objectType = form.objectType;
  }
  if (form.street !== initial.street) payload.street = form.street.trim();
  if (form.zip !== initial.zip) payload.zip = form.zip.trim();
  if (form.city !== initial.city) payload.city = form.city.trim();
  if (form.showExactAddress !== initial.showExactAddress) {
    payload.showExactAddress = form.showExactAddress;
  }

  if (form.coldRent !== initial.coldRent) {
    const coldRent = toNumber(form.coldRent);
    if (coldRent !== null) payload.coldRent = coldRent;
  }
  if (form.additionalCosts !== initial.additionalCosts) {
    const additionalCosts = toNumber(form.additionalCosts);
    if (additionalCosts !== null) payload.additionalCosts = additionalCosts;
  }
  if (form.deposit !== initial.deposit) {
    const deposit = toNumber(form.deposit);
    if (deposit !== null) payload.deposit = deposit;
  }
  if (form.depositMonths !== initial.depositMonths) {
    if (form.depositMonths !== null) payload.depositMonths = form.depositMonths;
  }
  if (form.livingArea !== initial.livingArea) {
    const livingArea = toNumber(form.livingArea);
    if (livingArea !== null) payload.livingArea = livingArea;
  }
  if (form.rooms !== initial.rooms) {
    const rooms = toNumber(form.rooms);
    if (rooms !== null) payload.rooms = rooms;
  }
  if (form.bedrooms !== initial.bedrooms) payload.bedrooms = form.bedrooms;
  if (form.availableFrom !== initial.availableFrom) {
    const availableFrom = toIsoDate(form.availableFrom);
    if (availableFrom !== undefined) payload.availableFrom = availableFrom;
  }

  if (form.shortDescription !== initial.shortDescription) {
    payload.shortDescription = form.shortDescription.trim();
  }

  if (form.minimumHouseholdNetIncome !== initial.minimumHouseholdNetIncome) {
    payload.minimumHouseholdNetIncome = toNumber(
      form.minimumHouseholdNetIncome,
    );
  }
  if (form.suitableForPeopleCount !== initial.suitableForPeopleCount) {
    payload.suitableForPeopleCount = form.suitableForPeopleCount;
  }
  if (form.schufaRequired !== initial.schufaRequired) {
    payload.schufaRequired = form.schufaRequired;
  }
  if (form.incomeProofRequired !== initial.incomeProofRequired) {
    payload.incomeProofRequired = form.incomeProofRequired;
  }
  if (form.petsPolicy !== initial.petsPolicy && form.petsPolicy !== "") {
    payload.petsPolicy = form.petsPolicy;
  }
  if (
    form.smokingPolicy !== initial.smokingPolicy &&
    form.smokingPolicy !== ""
  ) {
    payload.smokingPolicy = form.smokingPolicy;
  }

  return payload;
}

export function hasPayloadChanges(payload: UpdateListingPayload): boolean {
  return Object.keys(payload).length > 0;
}
