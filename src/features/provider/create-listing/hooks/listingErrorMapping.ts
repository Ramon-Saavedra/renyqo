import type { ListingDraftErrors } from "./useListingDraft";

type ZodFlatErrors = Record<string, string[] | undefined>;

export function mapZodErrors(flat: ZodFlatErrors): ListingDraftErrors {
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
    "minIncome",
    "peopleCount",
    "legalAccepted",
  ] as const;
  for (const key of keys) {
    const first = flat[key]?.[0];
    if (first) errors[key] = first;
  }
  return errors;
}

export function mapBackendMessage(message: string): ListingDraftErrors {
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

export function hasErrors(errors: ListingDraftErrors): boolean {
  return Object.values(errors).some(Boolean);
}
