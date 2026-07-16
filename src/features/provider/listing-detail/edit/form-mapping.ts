import type { ListingDetail } from "../types";
import type { ListingEditForm } from "./types";

function numberToString(value: number | null): string {
  return value === null ? "" : String(value);
}

function stringToNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Normalizes an ISO timestamp or date string to a `YYYY-MM-DD` input value. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const leading = /^(\d{4}-\d{2}-\d{2})/.exec(iso.trim());
  if (leading) return leading[1] as string;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildHeaderAddress(street: string, zip: string, city: string): string {
  const zipCity = [zip, city].filter(Boolean).join(" ");
  return [street, zipCity].filter(Boolean).join(", ") || "Adresse offen";
}

export function mapListingToEditForm(listing: ListingDetail): ListingEditForm {
  return {
    title: listing.title,
    objectType: listing.objectType ?? "APARTMENT",

    street: listing.street ?? "",
    zip: listing.zip ?? "",
    city: listing.city ?? "",
    showExactAddress: listing.showExactAddress ?? false,

    coldRent: numberToString(listing.coldRent),
    additionalCosts: numberToString(listing.additionalCosts),
    deposit: numberToString(listing.deposit),
    depositMonths: listing.depositMonths,
    livingArea: numberToString(listing.livingArea),
    rooms: numberToString(listing.rooms),
    bedrooms: listing.bedrooms,
    availableFrom: toDateInputValue(listing.availableFrom),

    shortDescription: listing.shortDescription ?? "",

    minimumHouseholdNetIncome: numberToString(
      listing.minimumHouseholdNetIncome,
    ),
    suitableForPeopleCount: listing.suitableForPeopleCount,
    schufaRequired: listing.schufaRequired ?? false,
    incomeProofRequired: listing.incomeProofRequired ?? false,
    petsPolicy: listing.petsPolicy ?? "",
    smokingPolicy: listing.smokingPolicy ?? "",
  };
}

export function isEditFormEqual(
  a: ListingEditForm,
  b: ListingEditForm,
): boolean {
  return (
    a.title === b.title &&
    a.objectType === b.objectType &&
    a.street === b.street &&
    a.zip === b.zip &&
    a.city === b.city &&
    a.showExactAddress === b.showExactAddress &&
    a.coldRent === b.coldRent &&
    a.additionalCosts === b.additionalCosts &&
    a.deposit === b.deposit &&
    a.depositMonths === b.depositMonths &&
    a.livingArea === b.livingArea &&
    a.rooms === b.rooms &&
    a.bedrooms === b.bedrooms &&
    a.availableFrom === b.availableFrom &&
    a.shortDescription === b.shortDescription &&
    a.minimumHouseholdNetIncome === b.minimumHouseholdNetIncome &&
    a.suitableForPeopleCount === b.suitableForPeopleCount &&
    a.schufaRequired === b.schufaRequired &&
    a.incomeProofRequired === b.incomeProofRequired &&
    a.petsPolicy === b.petsPolicy &&
    a.smokingPolicy === b.smokingPolicy
  );
}

/**
 * Projects the edited form values back onto the loaded listing so the detail
 * view can render the saved state without an extra network round-trip.
 */
export function applyEditFormToListing(
  listing: ListingDetail,
  form: ListingEditForm,
): ListingDetail {
  const street = form.street.trim() || null;
  const zip = form.zip.trim() || null;
  const city = form.city.trim() || null;

  return {
    ...listing,
    title: form.title.trim() || listing.title,
    objectType: form.objectType,
    street,
    zip,
    city,
    showExactAddress: form.showExactAddress,
    headerAddress: buildHeaderAddress(street ?? "", zip ?? "", city ?? ""),
    coldRent: stringToNumber(form.coldRent),
    additionalCosts: stringToNumber(form.additionalCosts),
    deposit: stringToNumber(form.deposit),
    depositMonths: form.depositMonths,
    livingArea: stringToNumber(form.livingArea),
    rooms: stringToNumber(form.rooms),
    bedrooms: form.bedrooms,
    availableFrom: form.availableFrom || null,
    shortDescription: form.shortDescription.trim() || null,
    minimumHouseholdNetIncome: stringToNumber(form.minimumHouseholdNetIncome),
    suitableForPeopleCount: form.suitableForPeopleCount,
    schufaRequired: form.schufaRequired,
    incomeProofRequired: form.incomeProofRequired,
    petsPolicy: form.petsPolicy || null,
    smokingPolicy: form.smokingPolicy || null,
    updatedAt: new Date().toISOString(),
  };
}
