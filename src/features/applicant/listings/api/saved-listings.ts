import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import type { PublicListing, PublicListingsResponse } from "../types";
import {
  mapPublicListing,
  PublicListingsContractError,
} from "./public-listings";

const savedListingsResponseSchema = z.object({
  items: z.array(z.unknown()),
  nextCursor: z.string().nullable(),
  total: z.number().finite(),
});

export class SavedListingsContractError extends Error {
  constructor() {
    super("Invalid saved listings response");
    this.name = "SavedListingsContractError";
  }
}

export interface SavedListingsParams {
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
}

function mapSavedListing(value: unknown): PublicListing {
  try {
    const listing = mapPublicListing(value);
    if (listing.isSaved === true) return listing;
  } catch (error) {
    if (error instanceof PublicListingsContractError) {
      throw new SavedListingsContractError();
    }
    throw error;
  }
  throw new SavedListingsContractError();
}

function buildQueryString(params: SavedListingsParams): string {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  return search.toString();
}

export async function getSavedListings(
  params: SavedListingsParams = {},
  options?: ApiRequestOptions,
): Promise<PublicListingsResponse> {
  const qs = buildQueryString(params);
  const path = qs
    ? `/api/v1/applicant/saved-listings?${qs}`
    : "/api/v1/applicant/saved-listings";
  const parsed = savedListingsResponseSchema.safeParse(
    await apiGet<unknown>(path, options),
  );
  if (!parsed.success) throw new SavedListingsContractError();

  return {
    listings: parsed.data.items.map(mapSavedListing),
    total: parsed.data.total,
    nextCursor: parsed.data.nextCursor,
  };
}
