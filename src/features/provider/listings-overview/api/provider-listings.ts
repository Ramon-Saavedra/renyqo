import type { ApiRequestOptions } from "@/lib/api/client";
import { apiPatch, apiPatchVoid } from "@/lib/api/client";
import type { ListingOverviewItem } from "../types";
import { getProviderListingsOverview } from "./provider-listings-overview";

export async function getProviderListings(
  providerOptions?: ApiRequestOptions,
): Promise<readonly ListingOverviewItem[]> {
  return getProviderListingsOverview(providerOptions);
}

export async function publishProviderListing(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/listings/${id}/publish`,
    providerOptions,
  );
}

export async function moveProviderListingToPosition(
  id: string,
  position: number,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatch<unknown>(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/position`,
    { position },
    providerOptions,
  );
}

export async function moveProviderListingToDraft(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/draft`, providerOptions);
}

export async function archiveProviderListing(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/retire`, providerOptions);
}

export async function pauseProviderListing(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/pause`,
    providerOptions,
  );
}

export async function resumeProviderListing(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/resume`,
    providerOptions,
  );
}
