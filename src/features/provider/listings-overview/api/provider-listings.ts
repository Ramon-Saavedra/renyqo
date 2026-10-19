import { apiPatch, apiPatchVoid } from "@/lib/api/client";
import type { ListingOverviewItem } from "../types";
import { getProviderListingsOverview } from "./provider-listings-overview";

export async function getProviderListings(): Promise<
  readonly ListingOverviewItem[]
> {
  return getProviderListingsOverview();
}

export async function publishProviderListing(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/publish`);
}

export async function moveProviderListingToPosition(
  id: string,
  position: number,
): Promise<void> {
  await apiPatch<unknown>(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/position`,
    { position },
  );
}

export async function moveProviderListingToDraft(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/draft`);
}

export async function archiveProviderListing(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/archive`);
}

export async function pauseProviderListing(id: string): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/pause`,
  );
}

export async function resumeProviderListing(id: string): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/listings/${encodeURIComponent(id)}/resume`,
  );
}
