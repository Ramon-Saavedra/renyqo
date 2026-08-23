import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import {
  isRecord,
  readBoolean,
  readCoverImageUrl,
  readItems,
  readNullableString,
  readNumber,
  readString,
} from "@/lib/api/response-mappers";
import type {
  ProfileMatchResult,
  PublicListing,
  PublicListingDetail,
  PublicListingsParams,
  PublicListingsResponse,
} from "../types";

function normalizeDetailProfileMatch(value: string | null): ProfileMatchResult {
  const upper = value?.toUpperCase();
  if (upper === "MATCH") return "match";
  if (upper === "NO_MATCH") return "no-match";
  if (upper === "PROFILE_INCOMPLETE") return "incomplete";
  return "unknown";
}

function normalizeListingProfileMatch(value: string | null): boolean | null {
  const upper = value?.toUpperCase();
  if (upper === "MATCH") return true;
  if (upper === "NO_MATCH") return false;
  return null;
}

function buildDisplayLocation(record: Record<string, unknown>): string {
  const existing = readString(record, ["displayAddress", "location"]);
  if (existing) return existing;

  const city = readString(record, ["city"]);
  const district = readString(record, ["district", "neighborhood"]);
  return [city, district].filter(Boolean).join(", ") || "Adresse folgt";
}

function buildDetailLocation({
  city,
  district,
  zip,
}: {
  readonly city: string | null;
  readonly district: string | null;
  readonly zip: string | null;
}): string | null {
  const location = [district, zip, city].filter(
    (value): value is string => value !== null,
  );
  return location.length > 0 ? location.join(" · ") : null;
}

function mapPublicListing(value: unknown): PublicListing | null {
  if (!isRecord(value)) return null;

  const id = readString(value, ["id"]);
  if (!id) return null;

  const profileMatchValue = readString(value, [
    "profileMatch",
    "profile_match",
  ]);

  return {
    id,
    title: readString(value, ["title"]) ?? "Unbenanntes Objekt",
    location: buildDisplayLocation(value),
    rooms: readNumber(value, ["rooms"]) ?? 0,
    livingArea: readNumber(value, ["livingArea", "area"]) ?? 0,
    availableFrom: readNullableString(value, [
      "availableFrom",
      "available_from",
      "moveInDate",
      "move_in_date",
    ]),
    coldRent: readNumber(value, ["coldRent", "rent", "price"]) ?? 0,
    serviceCharge:
      readNumber(value, [
        "serviceCharge",
        "service_charge",
        "additionalCosts",
        "additional_costs",
      ]) ?? 0,
    matchesProfile: normalizeListingProfileMatch(profileMatchValue),
    isNew: readBoolean(value, ["isNew", "is_new"]) ?? false,
    coverImageUrl: readCoverImageUrl(value),
    publishedAt: readString(value, ["publishedAt", "published_at"]) ?? "",
  };
}

function isPublicListing(item: PublicListing | null): item is PublicListing {
  return item !== null;
}

const nullableString = z.string().nullable();
const nullableNumber = z.number().finite().nullable();

const applicantListingDetailSchema = z.object({
  id: z.string().min(1),
  title: nullableString,
  city: nullableString,
  zip: nullableString,
  district: nullableString,
  street: nullableString,
  objectType: z.enum(["APARTMENT", "HOUSE", "ROOM"]).nullable(),
  livingArea: nullableNumber,
  rooms: nullableNumber,
  bedrooms: nullableNumber,
  coldRent: nullableNumber,
  additionalCosts: nullableNumber,
  deposit: nullableNumber,
  depositMonths: nullableNumber,
  availableFrom: nullableString,
  shortDescription: nullableString,
  publishedAt: nullableString,
  isNew: z.boolean(),
  images: z.array(
    z.object({
      secureUrl: z.string().min(1),
      position: z.number().finite(),
      isCover: z.boolean(),
    }),
  ),
  profileMatch: z.enum(["MATCH", "NO_MATCH", "PROFILE_INCOMPLETE", "UNKNOWN"]),
  requirements: z.object({
    minimumHouseholdNetIncome: nullableNumber,
    schufaRequired: z.boolean(),
    incomeProofRequired: z.boolean(),
    suitableForPeopleCount: nullableNumber,
    petsPolicy: z.enum(["ALLOWED", "BY_ARRANGEMENT", "NOT_ALLOWED"]).nullable(),
    smokingPolicy: z
      .enum(["ALLOWED", "BY_ARRANGEMENT", "NON_SMOKERS_PREFERRED"])
      .nullable(),
  }),
});

class ApplicantListingDetailContractError extends Error {
  constructor() {
    super("Invalid applicant listing detail response");
    this.name = "ApplicantListingDetailContractError";
  }
}

function mapPublicListingDetail(
  value: z.infer<typeof applicantListingDetailSchema>,
): PublicListingDetail {
  const images = value.images
    .map((image, index) => ({
      id: `${image.position}-${index}`,
      secureUrl: image.secureUrl,
      position: image.position,
      isCover: image.isCover,
    }))
    .sort((first, second) => first.position - second.position);

  return {
    id: value.id,
    title: value.title,
    location: buildDetailLocation(value),
    matchesProfile: normalizeDetailProfileMatch(value.profileMatch),
    street: value.street,
    zip: value.zip,
    city: value.city,
    district: value.district,
    objectType: value.objectType,
    livingArea: value.livingArea,
    rooms: value.rooms,
    bedrooms: value.bedrooms,
    coldRent: value.coldRent,
    additionalCosts: value.additionalCosts,
    deposit: value.deposit,
    depositMonths: value.depositMonths,
    availableFrom: value.availableFrom,
    shortDescription: value.shortDescription,
    publishedAt: value.publishedAt,
    isNew: value.isNew,
    images,
    minimumHouseholdNetIncome: value.requirements.minimumHouseholdNetIncome,
    schufaRequired: value.requirements.schufaRequired,
    incomeProofRequired: value.requirements.incomeProofRequired,
    suitableForPeopleCount: value.requirements.suitableForPeopleCount,
    petsPolicy: value.requirements.petsPolicy,
    smokingPolicy: value.requirements.smokingPolicy,
  };
}

function buildQueryString(params: PublicListingsParams): string {
  const search = new URLSearchParams();

  if (params.query) search.set("query", params.query);
  if (params.maxRent !== undefined && params.maxRent !== null) {
    search.set("maxRent", String(params.maxRent));
  }
  if (params.minRooms !== undefined && params.minRooms !== null) {
    search.set("minRooms", String(params.minRooms));
  }
  if (params.minLivingArea !== undefined && params.minLivingArea !== null) {
    search.set("minLivingArea", String(params.minLivingArea));
  }
  if (params.availableBy) search.set("availableBy", params.availableBy);
  if (params.onlyMatching) search.set("onlyMatching", "true");
  if (params.sort) search.set("sort", params.sort);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit !== undefined) search.set("limit", String(params.limit));

  return search.toString();
}

function readTotal(response: unknown): number {
  if (!isRecord(response)) return 0;
  const total = readNumber(response, [
    "total",
    "totalResults",
    "total_results",
  ]);
  return total ?? 0;
}

function readNextCursor(response: unknown): string | null {
  if (!isRecord(response)) return null;
  return readNullableString(response, ["nextCursor", "next_cursor", "cursor"]);
}

export async function getPublicListings(
  params: PublicListingsParams,
  options?: ApiRequestOptions,
): Promise<PublicListingsResponse> {
  const qs = buildQueryString(params);
  const path = qs ? `/api/v1/listings?${qs}` : "/api/v1/listings";
  const response = await apiGet<unknown>(path, options);

  return {
    listings: readItems(response).map(mapPublicListing).filter(isPublicListing),
    total: readTotal(response),
    nextCursor: readNextCursor(response),
  };
}

export async function getPublicListingDetail(
  id: string,
  options?: ApiRequestOptions,
): Promise<PublicListingDetail | null> {
  const response = await apiGet<unknown>(
    `/api/v1/listings/${encodeURIComponent(id)}`,
    options,
  );
  const parsed = applicantListingDetailSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApplicantListingDetailContractError();
  }
  return mapPublicListingDetail(parsed.data);
}
