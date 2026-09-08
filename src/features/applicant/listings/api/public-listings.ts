import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import {
  isRecord,
  readItems,
  readNullableString,
  readNumber,
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

function normalizeListingProfileMatch(
  value: "MATCH" | "NO_MATCH" | "PROFILE_INCOMPLETE" | "UNKNOWN",
): boolean | null {
  if (value === "MATCH") return true;
  if (value === "NO_MATCH") return false;
  return null;
}

function buildSummaryLocation(
  city: string | null,
  district: string | null,
): string {
  const location = [city, district].filter(
    (value): value is string => value !== null && value.trim().length > 0,
  );
  return location.length > 0 ? location.join(", ") : "Adresse folgt";
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

const listingApplicationStatusSchema = z.enum([
  "ACTIVE",
  "WAITING",
  "REJECTED",
  "ACCEPTED",
]);

const listingApplicationPublicReasonSchema = z.enum([
  "NOT_SELECTED",
  "PROFILE_NO_LONGER_ELIGIBLE",
  "LISTING_RENTED",
]);

const nullableString = z.string().nullable();
const nullableNumber = z.number().finite().nullable();
const nullableIsoDateTime = z
  .union([z.iso.datetime(), z.iso.date()])
  .nullable();

const applicantListingSummarySchema = z.object({
  id: z.string().min(1),
  title: nullableString,
  city: nullableString,
  zip: nullableString,
  district: nullableString,
  objectType: nullableString,
  livingArea: nullableNumber,
  rooms: nullableNumber,
  bedrooms: nullableNumber,
  coldRent: nullableNumber,
  additionalCosts: nullableNumber,
  deposit: nullableNumber,
  depositMonths: nullableNumber,
  availableFrom: nullableIsoDateTime,
  shortDescription: nullableString,
  publishedAt: nullableIsoDateTime,
  isNew: z.boolean(),
  petsPolicy: nullableString,
  coverImage: z
    .object({
      secureUrl: z.string().min(1),
    })
    .nullable(),
  profileMatch: z.enum(["MATCH", "NO_MATCH", "PROFILE_INCOMPLETE", "UNKNOWN"]),
  hasApplied: z.boolean(),
  applicationStatus: listingApplicationStatusSchema.nullable(),
  publicReason: listingApplicationPublicReasonSchema.nullable(),
  isSaved: z.boolean(),
});

export class PublicListingsContractError extends Error {
  constructor() {
    super("Invalid public listings response");
    this.name = "PublicListingsContractError";
  }
}

export function mapPublicListing(value: unknown): PublicListing {
  const parsed = applicantListingSummarySchema.safeParse(value);
  if (!parsed.success) {
    throw new PublicListingsContractError();
  }

  const listing = parsed.data;
  const title = listing.title?.trim() ?? "";

  return {
    id: listing.id,
    title: title.length > 0 ? title : "Unbenanntes Objekt",
    location: buildSummaryLocation(listing.city, listing.district),
    rooms: listing.rooms ?? 0,
    livingArea: listing.livingArea ?? 0,
    availableFrom: listing.availableFrom,
    coldRent: listing.coldRent ?? 0,
    serviceCharge: listing.additionalCosts ?? 0,
    matchesProfile: normalizeListingProfileMatch(listing.profileMatch),
    hasApplied: listing.hasApplied,
    applicationStatus: listing.applicationStatus,
    publicReason: listing.publicReason,
    isSaved: listing.isSaved,
    isNew: listing.isNew,
    coverImageUrl: listing.coverImage?.secureUrl ?? null,
    publishedAt: listing.publishedAt ?? "",
  };
}

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
  availableFrom: nullableIsoDateTime,
  shortDescription: nullableString,
  publishedAt: nullableIsoDateTime,
  isNew: z.boolean(),
  images: z.array(
    z.object({
      secureUrl: z.string().min(1),
      position: z.number().finite(),
      isCover: z.boolean(),
    }),
  ),
  profileMatch: z.enum(["MATCH", "NO_MATCH", "PROFILE_INCOMPLETE", "UNKNOWN"]),
  hasApplied: z.boolean(),
  applicationStatus: listingApplicationStatusSchema.nullable(),
  publicReason: listingApplicationPublicReasonSchema.nullable(),
  isSaved: z.boolean(),
  requirements: z.object({
    schufaRequired: z.boolean(),
    incomeProofRequired: z.boolean(),
    suitableForPeopleCount: nullableNumber,
    petsPolicy: z.enum(["ALLOWED", "BY_ARRANGEMENT", "NOT_ALLOWED"]).nullable(),
    smokingPolicy: z
      .enum(["ALLOWED", "BY_ARRANGEMENT", "NOT_ALLOWED"])
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
    hasApplied: value.hasApplied,
    applicationStatus: value.applicationStatus,
    publicReason: value.publicReason,
    isSaved: value.isSaved,
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
    listings: readItems(response).map(mapPublicListing),
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
