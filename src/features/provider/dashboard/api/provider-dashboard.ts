import { getProviderListings } from "@/features/provider/listings-overview/api/provider-listings";
import type { ListingOverviewItem } from "@/features/provider/listings-overview/types";
import type { DashboardObject, DashboardObjectStatus } from "../types";

const DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

function normalizeStatus(
  status: ListingOverviewItem["status"],
): DashboardObjectStatus {
  return status === "draft" ? "draft" : "published";
}

function formatAvailableFrom(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_TIME_FORMATTER.format(date);
}

function mapDashboardObject(listing: ListingOverviewItem): DashboardObject {
  const activeApplications = Math.min(listing.applicationsTotal, 5);

  return {
    id: listing.id,
    title: listing.title,
    fullTitle: listing.title,
    district: listing.displayAddress,
    address: listing.displayAddress,
    coldRent: listing.coldRent,
    livingArea: listing.livingArea,
    rooms: String(listing.rooms),
    availableFrom: formatAvailableFrom(listing.availableFrom ?? null),
    publishedAt: formatDateTime(listing.publishedAt),
    updatedAt: formatDateTime(listing.updatedAt),
    status: normalizeStatus(listing.status),
    activeApplications,
    coverImageUrl: listing.coverImageUrl ?? null,
  };
}

export async function getProviderDashboardObjects(): Promise<
  readonly DashboardObject[]
> {
  const listings = await getProviderListings();
  return listings.map(mapDashboardObject);
}
