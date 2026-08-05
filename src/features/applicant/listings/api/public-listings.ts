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
  PublicListing,
  PublicListingsParams,
  PublicListingsResponse,
} from "../types";

function normalizeProfileMatch(value: string | null): boolean | null {
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
    matchesProfile: normalizeProfileMatch(profileMatchValue),
    isNew: readBoolean(value, ["isNew", "is_new"]) ?? false,
    coverImageUrl: readCoverImageUrl(value),
    publishedAt: readString(value, ["publishedAt", "published_at"]) ?? "",
  };
}

function isPublicListing(item: PublicListing | null): item is PublicListing {
  return item !== null;
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
): Promise<PublicListing | null> {
  const response = await apiGet<unknown>(
    `/api/v1/listings/${encodeURIComponent(id)}`,
    options,
  );
  if (isRecord(response)) {
    return mapPublicListing(response);
  }
  return null;
}
