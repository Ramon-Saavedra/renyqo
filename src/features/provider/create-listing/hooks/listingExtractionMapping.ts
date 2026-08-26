import type {
  ListingExtractionIssue,
  ListingExtractionValues,
} from "@/lib/api/listing-assistance";
import { createListingCopy } from "../copy/create-listing";
import type { DepositMonths, ListingDraft } from "./useListingDraft";

export interface ExtractionFieldDescriptor {
  readonly key: string;
  readonly label: string;
  apply(setField: SetDraftField): void;
}

type SetDraftField = <K extends keyof ListingDraft>(
  field: K,
  value: ListingDraft[K],
) => void;

const FIELD_LABELS = createListingCopy.aiCapture.fieldLabels;
const MISSING_FIELD_LABELS = createListingCopy.aiCapture.missingFieldLabels;

function clampRoomsOption(value: number): string {
  const clamped = Math.min(50, Math.max(1, value));
  const rounded = Math.round(clamped * 2) / 2;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

function clampIntegerOption(value: number, min: number, max: number): string {
  return String(Math.min(max, Math.max(min, Math.round(value))));
}

function clampDecimalOption(value: number, min: number, max: number): string {
  const clamped = Math.min(max, Math.max(min, value));
  return String(Math.round(clamped * 10) / 10);
}

function toDateInputValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1];
}

export function buildExtractionFieldDescriptors(
  values: ListingExtractionValues,
): ExtractionFieldDescriptor[] {
  const descriptors: ExtractionFieldDescriptor[] = [];

  if (values.city !== undefined) {
    const city = values.city;
    descriptors.push({
      key: "city",
      label: FIELD_LABELS.city,
      apply: (setField) => setField("city", city),
    });
  }
  if (values.zip !== undefined) {
    const zip = values.zip;
    descriptors.push({
      key: "zip",
      label: FIELD_LABELS.zip,
      apply: (setField) => setField("zip", zip),
    });
  }
  if (values.street !== undefined) {
    const street = values.street;
    descriptors.push({
      key: "street",
      label: FIELD_LABELS.street,
      apply: (setField) => setField("street", street),
    });
  }
  if (values.objectType !== undefined) {
    const objectType =
      values.objectType === "APARTMENT"
        ? "wohnung"
        : values.objectType === "HOUSE"
          ? "haus"
          : values.objectType === "ROOM"
            ? "zimmer"
            : undefined;
    if (objectType) {
      descriptors.push({
        key: "objectType",
        label: FIELD_LABELS.objectType,
        apply: (setField) => setField("objectType", objectType),
      });
    }
  }
  if (values.livingArea !== undefined) {
    const area = clampDecimalOption(values.livingArea, 0, 100000);
    descriptors.push({
      key: "livingArea",
      label: FIELD_LABELS.area,
      apply: (setField) => setField("area", area),
    });
  }
  if (values.rooms !== undefined) {
    const rooms = clampRoomsOption(values.rooms);
    descriptors.push({
      key: "rooms",
      label: FIELD_LABELS.rooms,
      apply: (setField) => setField("rooms", rooms),
    });
  }
  if (values.bedrooms !== undefined && values.bedrooms !== null) {
    const bedrooms = clampIntegerOption(values.bedrooms, 0, 50);
    descriptors.push({
      key: "bedrooms",
      label: FIELD_LABELS.bedrooms,
      apply: (setField) => setField("bedrooms", bedrooms),
    });
  }
  if (values.coldRent !== undefined) {
    const price = clampIntegerOption(values.coldRent, 0, 1_000_000);
    descriptors.push({
      key: "coldRent",
      label: FIELD_LABELS.price,
      apply: (setField) => setField("price", price),
    });
  }
  if (values.additionalCosts !== undefined) {
    const additionalCosts = clampIntegerOption(
      values.additionalCosts,
      0,
      1_000_000,
    );
    descriptors.push({
      key: "additionalCosts",
      label: FIELD_LABELS.additionalCosts,
      apply: (setField) => setField("additionalCosts", additionalCosts),
    });
  }
  if (values.depositMonths !== undefined) {
    const depositMonths = Math.min(
      3,
      Math.max(1, Math.round(values.depositMonths)),
    ) as DepositMonths;
    descriptors.push({
      key: "depositMonths",
      label: FIELD_LABELS.depositMonths,
      apply: (setField) => setField("depositMonths", depositMonths),
    });
  }
  const availableFrom = toDateInputValue(values.availableFrom);
  if (availableFrom) {
    descriptors.push({
      key: "availableFrom",
      label: FIELD_LABELS.availableFrom,
      apply: (setField) => setField("availableFrom", availableFrom),
    });
  }
  if (values.title !== undefined) {
    const title = values.title;
    descriptors.push({
      key: "title",
      label: FIELD_LABELS.title,
      apply: (setField) => setField("titleOverride", title),
    });
  }
  if (values.shortDescription !== undefined) {
    const description = values.shortDescription.slice(0, 800);
    descriptors.push({
      key: "shortDescription",
      label: FIELD_LABELS.description,
      apply: (setField) => setField("description", description),
    });
  }
  if (
    values.minimumHouseholdNetIncome !== undefined &&
    values.minimumHouseholdNetIncome !== null
  ) {
    const minIncome = clampIntegerOption(
      values.minimumHouseholdNetIncome,
      0,
      1_000_000,
    );
    descriptors.push({
      key: "minimumHouseholdNetIncome",
      label: FIELD_LABELS.minIncome,
      apply: (setField) => setField("minIncome", minIncome),
    });
  }
  if (values.schufaRequired !== undefined) {
    const schufa = values.schufaRequired ? "erforderlich" : "nein";
    descriptors.push({
      key: "schufaRequired",
      label: FIELD_LABELS.schufa,
      apply: (setField) => setField("schufa", schufa),
    });
  }
  if (values.incomeProofRequired !== undefined) {
    const income = values.incomeProofRequired ? "erforderlich" : "nein";
    descriptors.push({
      key: "incomeProofRequired",
      label: FIELD_LABELS.income,
      apply: (setField) => setField("income", income),
    });
  }
  if (
    values.suitableForPeopleCount !== undefined &&
    values.suitableForPeopleCount !== null
  ) {
    const peopleCount = values.suitableForPeopleCount;
    descriptors.push({
      key: "suitableForPeopleCount",
      label: FIELD_LABELS.peopleCount,
      apply: (setField) => setField("peopleCount", peopleCount),
    });
  }
  if (values.petsPolicy !== undefined) {
    const pets =
      values.petsPolicy === "ALLOWED"
        ? "erlaubt"
        : values.petsPolicy === "BY_ARRANGEMENT"
          ? "absprache"
          : values.petsPolicy === "NOT_ALLOWED"
            ? "keine"
            : undefined;
    if (pets) {
      descriptors.push({
        key: "petsPolicy",
        label: FIELD_LABELS.pets,
        apply: (setField) => setField("pets", pets),
      });
    }
  }
  if (values.smokingPolicy !== undefined) {
    const smoking =
      values.smokingPolicy === "ALLOWED"
        ? "erlaubt"
        : values.smokingPolicy === "BY_ARRANGEMENT"
          ? "absprache"
          : values.smokingPolicy === "NOT_ALLOWED"
            ? "keine"
            : undefined;
    if (smoking) {
      descriptors.push({
        key: "smokingPolicy",
        label: FIELD_LABELS.smoking,
        apply: (setField) => setField("smoking", smoking),
      });
    }
  }

  return descriptors;
}

export function applyExtractionResult(
  values: ListingExtractionValues,
  descriptors: readonly ExtractionFieldDescriptor[],
  setField: SetDraftField,
): void {
  for (const descriptor of descriptors) descriptor.apply(setField);
  if (values.showExactAddress !== undefined) {
    setField("hideAddress", !values.showExactAddress);
  }
}

const BACKEND_FIELD_LABELS: Record<string, string> = {
  ...MISSING_FIELD_LABELS,
  city: FIELD_LABELS.city,
  zip: FIELD_LABELS.zip,
  objectType: FIELD_LABELS.objectType,
  district: "Stadtteil",
  showExactAddress: "Adresse öffentlich anzeigen",
  additionalCosts: FIELD_LABELS.additionalCosts,
  deposit: FIELD_LABELS.depositMonths,
  depositMonths: FIELD_LABELS.depositMonths,
  shortDescription: FIELD_LABELS.description,
  minimumHouseholdNetIncome: FIELD_LABELS.minIncome,
  schufaRequired: FIELD_LABELS.schufa,
  incomeProofRequired: FIELD_LABELS.income,
  suitableForPeopleCount: FIELD_LABELS.peopleCount,
  petsPolicy: FIELD_LABELS.pets,
  smokingPolicy: FIELD_LABELS.smoking,
  listing: FIELD_LABELS.rooms,
};

export function mapMissingFieldLabel(field: string): string {
  return BACKEND_FIELD_LABELS[field] ?? FIELD_LABELS.unknown;
}

export function mapInconsistencyLabel(issue: ListingExtractionIssue): string {
  return BACKEND_FIELD_LABELS[issue.field] ?? FIELD_LABELS.unknown;
}

const RECOMMENDED_KEYS = [
  "minimumHouseholdNetIncome",
  "schufaRequired",
  "incomeProofRequired",
  "suitableForPeopleCount",
  "petsPolicy",
  "smokingPolicy",
] as const;

const RECOMMENDED_LABELS: Record<(typeof RECOMMENDED_KEYS)[number], string> = {
  minimumHouseholdNetIncome: FIELD_LABELS.minIncome,
  schufaRequired: FIELD_LABELS.schufa,
  incomeProofRequired: FIELD_LABELS.income,
  suitableForPeopleCount:
    createListingCopy.requirements.fields.peopleCount.label,
  petsPolicy: FIELD_LABELS.pets,
  smokingPolicy: FIELD_LABELS.smoking,
};

export function findMissingRecommendedLabels(
  descriptors: readonly ExtractionFieldDescriptor[],
): string[] {
  const present = new Set(descriptors.map((d) => d.key));
  return RECOMMENDED_KEYS.filter((key) => !present.has(key)).map(
    (key) => RECOMMENDED_LABELS[key],
  );
}

export const BACKEND_FIELD_TARGET_IDS: Readonly<Record<string, string>> = {
  city: "city",
  zip: "zip",
  street: "street",
  livingArea: "area",
  rooms: "rooms",
  bedrooms: "bedrooms",
  coldRent: "price",
  availableFrom: "available-from",
  additionalCosts: "additional-costs",
  title: "title-override",
  shortDescription: "listing-description",
  minimumHouseholdNetIncome: "min-income",
  schufaRequired: "schufa-required",
  incomeProofRequired: "income-proof-required",
  suitableForPeopleCount: "people-count",
  petsPolicy: "pets-policy",
  smokingPolicy: "smoking-policy",
  deposit: "deposit-months",
  depositMonths: "deposit-months",
  objectType: "sec-01",
  district: "city",
  listing: "rooms",
  showExactAddress: "hide-address",
};

export function mapBackendFieldToTargetId(field: string): string | null {
  return BACKEND_FIELD_TARGET_IDS[field] ?? null;
}

export function mapExtractionWarning(warning: string): string {
  const normalized = warning.toLowerCase();
  if (normalized.includes("availablefrom")) {
    return createListingCopy.aiCapture.warnings.uncertainAvailableFrom;
  }
  if (normalized.includes("bedrooms")) {
    return createListingCopy.aiCapture.warnings.uncertainBedrooms;
  }
  return createListingCopy.aiCapture.warnings.generic;
}
