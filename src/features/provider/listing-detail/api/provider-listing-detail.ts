import { apiGet } from "@/lib/api/client";
import type {
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import type { ListingDetail, ListingStatus } from "../types";

export {
  publishProviderListing,
  moveProviderListingToDraft,
  archiveProviderListing,
} from "../../listings-overview/api/provider-listings";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: ApiRecord, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

function readNumber(record: ApiRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(
  record: ApiRecord,
  keys: readonly string[],
): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function normalizeStatus(value: string | null): ListingStatus {
  switch (value?.toLowerCase()) {
    case "published":
      return "published";
    case "paused":
      return "paused";
    case "archived":
      return "archived";
    default:
      return "draft";
  }
}

function normalizeObjectType(value: string | null): ObjectTypeBackend | null {
  switch (value?.toUpperCase()) {
    case "APARTMENT":
      return "APARTMENT";
    case "HOUSE":
      return "HOUSE";
    case "ROOM":
      return "ROOM";
    default:
      return null;
  }
}

function normalizePolicy(value: string | null): PetPolicyBackend | null {
  switch (value?.toUpperCase()) {
    case "ALLOWED":
      return "ALLOWED";
    case "BY_ARRANGEMENT":
      return "BY_ARRANGEMENT";
    case "PREFER_NOT":
      return "PREFER_NOT";
    default:
      return null;
  }
}

function normalizeSmokingPolicy(
  value: string | null,
): SmokingPolicyBackend | null {
  switch (value?.toUpperCase()) {
    case "ALLOWED":
      return "ALLOWED";
    case "BY_ARRANGEMENT":
      return "BY_ARRANGEMENT";
    case "NON_SMOKERS_PREFERRED":
      return "NON_SMOKERS_PREFERRED";
    default:
      return null;
  }
}

function readImageUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (!isRecord(value)) return null;
  return readString(value, ["url", "src", "imageUrl", "publicUrl", "fileUrl"]);
}

function readImages(record: ApiRecord): string[] {
  const collected: string[] = [];
  const push = (url: string | null) => {
    if (url && !collected.includes(url)) collected.push(url);
  };

  push(
    readString(record, [
      "coverImageUrl",
      "coverUrl",
      "imageUrl",
      "thumbnailUrl",
    ]),
  );
  push(readImageUrl(record.coverImage));

  const arrays = [
    record.photos,
    record.images,
    record.listingImages,
    record.listing_images,
  ];
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) push(readImageUrl(item));
  }

  return collected;
}

function buildHeaderAddress(record: ApiRecord): string {
  const existing = readString(record, ["displayAddress"]);
  if (existing) return existing;

  const street = readString(record, ["street"]);
  const zip = readString(record, ["zip", "postalCode"]);
  const city = readString(record, ["city"]);
  const zipCity = [zip, city].filter(Boolean).join(" ");

  return [street, zipCity].filter(Boolean).join(", ") || "Adresse offen";
}

export function mapProviderListingDetail(value: unknown): ListingDetail | null {
  const record = isRecord(value)
    ? isRecord(value.listing)
      ? value.listing
      : isRecord(value.data)
        ? value.data
        : value
    : null;
  if (!record) return null;

  const id = readString(record, ["id"]);
  if (!id) return null;

  return {
    id,
    title: readString(record, ["title"]) ?? "Unbenanntes Objekt",
    status: normalizeStatus(readString(record, ["status"])),
    objectType: normalizeObjectType(readString(record, ["objectType", "type"])),

    street: readString(record, ["street"]),
    zip: readString(record, ["zip", "postalCode"]),
    city: readString(record, ["city"]),
    showExactAddress: readBoolean(record, ["showExactAddress"]),
    headerAddress: buildHeaderAddress(record),

    coldRent: readNumber(record, ["coldRent", "rent", "price"]),
    additionalCosts: readNumber(record, ["additionalCosts", "extraCosts"]),
    deposit: readNumber(record, ["deposit"]),
    depositMonths: readNumber(record, ["depositMonths"]),
    livingArea: readNumber(record, ["livingArea", "area"]),
    rooms: readNumber(record, ["rooms"]),
    bedrooms: readNumber(record, ["bedrooms"]),
    availableFrom: readString(record, [
      "availableFrom",
      "available_from",
      "moveInDate",
      "move_in_date",
    ]),

    shortDescription: readString(record, ["shortDescription", "description"]),

    schufaRequired: readBoolean(record, ["schufaRequired"]),
    incomeProofRequired: readBoolean(record, ["incomeProofRequired"]),
    minimumHouseholdNetIncome: readNumber(record, [
      "minimumHouseholdNetIncome",
    ]),
    suitableForPeopleCount: readNumber(record, ["suitableForPeopleCount"]),
    petsPolicy: normalizePolicy(readString(record, ["petsPolicy"])),
    smokingPolicy: normalizeSmokingPolicy(
      readString(record, ["smokingPolicy"]),
    ),

    images: readImages(record),

    createdAt: readString(record, ["createdAt"]),
    updatedAt: readString(record, ["updatedAt"]),
    publishedAt: readString(record, ["publishedAt"]),
  };
}

export async function getProviderListing(id: string): Promise<ListingDetail> {
  const response = await apiGet<unknown>(`/api/v1/provider/listings/${id}`);
  const listing = mapProviderListingDetail(response);
  if (!listing) {
    throw new Error("Listing detail response could not be parsed");
  }
  return listing;
}
