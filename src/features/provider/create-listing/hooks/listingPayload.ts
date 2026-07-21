import type {
  CreateListingPayload,
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
  UpdateListingPayload,
} from "@/lib/api/listings";
import {
  isConfiguredCriterion,
  parseMinimumHouseholdNetIncome,
  parseSuitableForPeopleCount,
} from "@/lib/validators/eligibility-criteria";
import type { DepositMonths, ListingDraft } from "./useListingDraft";
import { INITIAL_DRAFT } from "./useListingDraft";
import {
  normalizeListingDate,
  parseListingNumber,
} from "../utils/listing-validation";

function toPositiveNumber(value: string): number {
  const parsed = parseListingNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : 0;
}

function toOptionalPositiveNumber(value: string): number | undefined {
  const parsed = parseListingNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function toOptionalNonNegativeNumber(value: string): number | undefined {
  const parsed = parseListingNumber(value);
  return parsed !== undefined && parsed >= 0 ? parsed : undefined;
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
    normalizeListingDate(draft.availableFrom) !== undefined ||
    hasText(draft.titleOverride) ||
    hasText(draft.description) ||
    draft.photos.length > 0 ||
    parseMinimumHouseholdNetIncome(draft.minIncome) !== undefined ||
    draft.schufa !== INITIAL_DRAFT.schufa ||
    draft.income !== INITIAL_DRAFT.income ||
    draft.peopleCount !== null ||
    draft.pets !== INITIAL_DRAFT.pets ||
    draft.smoking !== INITIAL_DRAFT.smoking
  );
}

export function mapDraftToCreateListingDto(
  draft: ListingDraft,
  title: string,
): CreateListingPayload {
  const coldRent = toPositiveNumber(draft.price);
  const deposit = calculateDeposit(coldRent, draft.depositMonths);
  const minimumHouseholdNetIncome = parseMinimumHouseholdNetIncome(
    draft.minIncome,
  );
  const suitableForPeopleCount = parseSuitableForPeopleCount(draft.peopleCount);

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
    availableFrom: normalizeListingDate(draft.availableFrom),
    title: title.trim(),
    shortDescription: draft.description.trim(),
    ...(isConfiguredCriterion(minimumHouseholdNetIncome)
      ? { minimumHouseholdNetIncome }
      : {}),
    schufaRequired: toRequirement(draft.schufa),
    incomeProofRequired: toRequirement(draft.income),
    ...(isConfiguredCriterion(suitableForPeopleCount)
      ? { suitableForPeopleCount }
      : {}),
    petsPolicy: toPetsPolicy(draft.pets),
    smokingPolicy: toSmokingPolicy(draft.smoking),
  };
}

export function mapCreateListingPayloadToUpdatePayload(
  source: CreateListingPayload,
): UpdateListingPayload {
  return {
    ...(source.title !== undefined ? { title: source.title } : {}),
    ...(source.objectType !== undefined
      ? { objectType: source.objectType }
      : {}),
    ...(source.street !== undefined ? { street: source.street } : {}),
    ...(source.zip !== undefined ? { zip: source.zip } : {}),
    ...(source.city !== undefined ? { city: source.city } : {}),
    ...(source.showExactAddress !== undefined
      ? { showExactAddress: source.showExactAddress }
      : {}),
    ...(source.coldRent !== undefined ? { coldRent: source.coldRent } : {}),
    ...(source.additionalCosts !== undefined
      ? { additionalCosts: source.additionalCosts }
      : {}),
    ...(source.deposit !== undefined ? { deposit: source.deposit } : {}),
    ...(source.depositMonths !== undefined
      ? { depositMonths: source.depositMonths }
      : {}),
    ...(source.livingArea !== undefined
      ? { livingArea: source.livingArea }
      : {}),
    ...(source.rooms !== undefined ? { rooms: source.rooms } : {}),
    ...(source.bedrooms !== undefined ? { bedrooms: source.bedrooms } : {}),
    ...(source.availableFrom !== undefined
      ? { availableFrom: source.availableFrom }
      : {}),
    ...(source.shortDescription !== undefined
      ? { shortDescription: source.shortDescription }
      : {}),
    ...(source.minimumHouseholdNetIncome !== undefined
      ? { minimumHouseholdNetIncome: source.minimumHouseholdNetIncome }
      : {}),
    ...(source.suitableForPeopleCount !== undefined
      ? { suitableForPeopleCount: source.suitableForPeopleCount }
      : {}),
    ...(source.schufaRequired !== undefined
      ? { schufaRequired: source.schufaRequired }
      : {}),
    ...(source.incomeProofRequired !== undefined
      ? { incomeProofRequired: source.incomeProofRequired }
      : {}),
    ...(source.petsPolicy !== undefined
      ? { petsPolicy: source.petsPolicy }
      : {}),
    ...(source.smokingPolicy !== undefined
      ? { smokingPolicy: source.smokingPolicy }
      : {}),
  };
}

type MutableCreateListingPayload = {
  -readonly [K in keyof CreateListingPayload]: CreateListingPayload[K];
};

export function mapDraftToPartialCreateListingDto(
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
  const availableFrom = normalizeListingDate(draft.availableFrom);
  const trimmedTitle = title.trim();
  const shortDescription = draft.description.trim();
  const minimumHouseholdNetIncome = parseMinimumHouseholdNetIncome(
    draft.minIncome,
  );
  const suitableForPeopleCount = parseSuitableForPeopleCount(draft.peopleCount);

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
  if (isConfiguredCriterion(minimumHouseholdNetIncome)) {
    payload.minimumHouseholdNetIncome = minimumHouseholdNetIncome;
  }
  if (draft.schufa !== INITIAL_DRAFT.schufa) {
    payload.schufaRequired = toRequirement(draft.schufa);
  }
  if (draft.income !== INITIAL_DRAFT.income) {
    payload.incomeProofRequired = toRequirement(draft.income);
  }
  if (isConfiguredCriterion(suitableForPeopleCount)) {
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
