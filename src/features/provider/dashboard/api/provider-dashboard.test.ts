import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProviderListings } from "@/features/provider/listings-overview/api/provider-listings";
import { getProviderDashboardObjects } from "./provider-dashboard";

vi.mock("@/features/provider/listings-overview/api/provider-listings", () => ({
  getProviderListings: vi.fn(),
}));

describe("getProviderDashboardObjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps backend listings to dashboard objects", async () => {
    vi.mocked(getProviderListings).mockResolvedValue([
      {
        id: "listing-1",
        title: "Wohnung am Park",
        displayAddress: "Parkstraße 1 · Berlin",
        coverImageUrl: "https://res.cloudinary.com/demo/image/upload/flat.jpg",
        coldRent: 980,
        livingArea: 68,
        rooms: 2.5,
        status: "published",
        applicationsTotal: 7,
        needsAttention: false,
        attentionReason: null,
        openQuestionsCount: 0,
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: "2026-07-02T11:00:00.000Z",
        availableFrom: "2026-08-01",
      },
      {
        id: "listing-2",
        title: "Entwurf",
        displayAddress: "Adresse offen",
        coverImageUrl: null,
        coldRent: 0,
        livingArea: 0,
        rooms: 0,
        status: "draft",
        applicationsTotal: 0,
        needsAttention: false,
        attentionReason: null,
        openQuestionsCount: 0,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
        publishedAt: null,
        availableFrom: null,
      },
    ]);

    await expect(getProviderDashboardObjects()).resolves.toEqual([
      {
        id: "listing-1",
        title: "Wohnung am Park",
        fullTitle: "Wohnung am Park",
        district: "Parkstraße 1 · Berlin",
        address: "Parkstraße 1 · Berlin",
        coldRent: 980,
        livingArea: 68,
        rooms: "2.5",
        availableFrom: "01.08.2026",
        publishedAt: "02.07.2026, 13:00",
        updatedAt: "02.07.2026, 12:00",
        status: "published",
        activeApplications: 5,
        coverImageUrl: "https://res.cloudinary.com/demo/image/upload/flat.jpg",
      },
      {
        id: "listing-2",
        title: "Entwurf",
        fullTitle: "Entwurf",
        district: "Adresse offen",
        address: "Adresse offen",
        coldRent: 0,
        livingArea: 0,
        rooms: "0",
        availableFrom: null,
        publishedAt: null,
        updatedAt: "01.01.1970, 01:00",
        status: "draft",
        activeApplications: 0,
        coverImageUrl: null,
      },
    ]);
  });
});
