import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api/client";
import {
  getProviderListingsOverview,
  ProviderListingsOverviewContractError,
} from "./provider-listings-overview";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

const emptyAttention = {
  applicationsWithPendingActions: 0,
  totalPendingActions: 0,
  actionableUnreadMessageCount: 0,
  categories: {
    documentUploadCount: 0,
    documentReviewCount: 0,
    viewingActionCount: 0,
  },
  nextRevalidateAt: null,
};

const overviewPage = {
  items: [
    {
      listing: {
        id: "listing-1",
        title: "Wohnung in Berlin",
        city: "Berlin",
        coldRent: 1200,
        status: "PUBLISHED",
        imageUrl: "https://example.com/cover.jpg",
      },
      activeApplicationsCount: 2,
      waitingCount: 0,
      exitedApplicationsCount: 0,
      attention: emptyAttention,
    },
  ],
  pagination: {
    limit: 100,
    hasMore: false,
    nextCursor: null,
  },
  totalCount: 1,
};

describe("getProviderListingsOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps overview rows and derives Klärung filter from attention totals", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      ...overviewPage,
      items: [
        {
          ...overviewPage.items[0],
          attention: {
            ...emptyAttention,
            totalPendingActions: 1,
            applicationsWithPendingActions: 1,
          },
        },
      ],
    });

    const listings = await getProviderListingsOverview();
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/listings/overview?limit=100",
    );
    expect(listings).toHaveLength(1);
    expect(listings[0]?.needsAttention).toBe(true);
    expect(listings[0]?.attention.totalPendingActions).toBe(1);
    expect(listings[0]?.displayAddress).toBe("Berlin");
  });

  it("does not mark listings needing attention from category counts alone", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      ...overviewPage,
      items: [
        {
          ...overviewPage.items[0],
          attention: {
            ...emptyAttention,
            categories: {
              documentUploadCount: 2,
              documentReviewCount: 0,
              viewingActionCount: 0,
            },
          },
        },
      ],
    });

    const listings = await getProviderListingsOverview();
    expect(listings[0]?.needsAttention).toBe(false);
  });

  it("rejects malformed overview responses", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [] });

    await expect(getProviderListingsOverview()).rejects.toBeInstanceOf(
      ProviderListingsOverviewContractError,
    );
  });

  it("preserves full listing facts and order while using authoritative attention and cover", async () => {
    vi.mocked(apiGet).mockImplementation(async (path) =>
      path === "/api/v1/provider/listings"
        ? [
            {
              id: "listing-1",
              displayOrder: 4,
              objectType: "APARTMENT",
              street: "Teststraße 1",
              city: "Berlin",
              zip: "10115",
              livingArea: 82,
              rooms: 3.5,
              deposit: 2400,
              depositMonths: 2,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-10-01T00:00:00.000Z",
              publishedAt: "2026-02-01T00:00:00.000Z",
              availableFrom: "2026-11-01",
            },
          ]
        : overviewPage,
    );
    const [listing] = await getProviderListingsOverview();
    expect(listing).toMatchObject({
      displayOrder: 4,
      livingArea: 82,
      rooms: 3.5,
      deposit: 2400,
      depositMonths: 2,
      publishedAt: "2026-02-01T00:00:00.000Z",
      availableFrom: "2026-11-01",
      coverImageUrl: "https://example.com/cover.jpg",
      activeApplicationsCount: 2,
    });
    expect(listing?.displayAddress).toContain("Teststraße 1");
  });

  it("follows overview pagination and rejects repeating cursors", async () => {
    vi.mocked(apiGet).mockImplementation(async (path) =>
      path === "/api/v1/provider/listings"
        ? []
        : {
            ...overviewPage,
            pagination: {
              limit: 100,
              hasMore: true,
              nextCursor: "same-cursor",
            },
          },
    );
    await expect(getProviderListingsOverview()).rejects.toBeInstanceOf(
      ProviderListingsOverviewContractError,
    );
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/listings/overview?limit=100&cursor=same-cursor",
    );
  });
});
