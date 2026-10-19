import { beforeEach, describe, expect, it, vi } from "vitest";

import { createListingOverviewItem } from "@/features/provider/listings-overview/testing/listing-overview-fixtures";
import { getProviderListings } from "@/features/provider/listings-overview/api/provider-listings";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import { getProviderDashboardObjects } from "./provider-dashboard";

vi.mock("@/features/provider/listings-overview/api/provider-listings", () => ({
  getProviderListings: vi.fn(),
}));

describe("getProviderDashboardObjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps listings and propagates activeApplicationsCount", async () => {
    vi.mocked(getProviderListings).mockResolvedValue([
      createListingOverviewItem({
        id: "listing-1",
        title: "Wohnung am Park",
        objectType: "APARTMENT",
        displayAddress: "Parkstraße 1 · Berlin",
        coverImageUrl: "https://res.cloudinary.com/demo/image/upload/flat.jpg",
        coldRent: 980,
        livingArea: 68,
        rooms: 2.5,
        status: "published",
        activeApplicationsCount: 3,
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: "2026-07-02T11:00:00.000Z",
        availableFrom: "2026-08-01",
      }),
      createListingOverviewItem({
        id: "listing-2",
        title: "Entwurf",
        objectType: null,
        displayAddress: "Adresse offen",
        coverImageUrl: null,
        coldRent: 0,
        livingArea: 0,
        rooms: 0,
        status: "draft",
        activeApplicationsCount: 0,
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: null,
        availableFrom: null,
      }),
    ]);

    const objects = await getProviderDashboardObjects();
    expect(objects).toHaveLength(2);
    expect(objects[0]?.activeApplicationsCount).toBe(3);
    expect(objects[0]?.attention).toEqual(
      createListingOverviewItem().attention,
    );
    expect(objects[1]?.status).toBe("draft");
  });

  it("preserves the authoritative active application count for display consumers", async () => {
    vi.mocked(getProviderListings).mockResolvedValue([
      createListingOverviewItem({
        activeApplicationsCount: MAX_ACTIVE_APPLICATIONS + 1,
      }),
    ]);

    const objects = await getProviderDashboardObjects();
    expect(objects[0]?.activeApplicationsCount).toBe(
      MAX_ACTIVE_APPLICATIONS + 1,
    );
  });
});
