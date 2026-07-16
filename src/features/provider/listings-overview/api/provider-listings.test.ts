import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet, apiPatchVoid } from "@/lib/api/client";
import {
  archiveProviderListing,
  getProviderListings,
  moveProviderListingToDraft,
  publishProviderListing,
} from "./provider-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPatchVoid: vi.fn(),
}));

describe("getProviderListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads provider listings from the backend endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValue([]);

    await expect(getProviderListings()).resolves.toEqual([]);

    expect(apiGet).toHaveBeenCalledWith("/api/v1/provider/listings");
  });

  it("maps backend listing rows to overview items", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: "listing-1",
        title: "Wohnung in Berlin",
        photos: ["https://example.com/cover.jpg"],
        street: "Musterstraße 1",
        zip: "10115",
        city: "Berlin",
        status: "PUBLISHED",
        coldRent: 1200,
        deposit: 2400,
        depositMonths: 2,
        livingArea: 70,
        rooms: 3,
        applicationsCount: 4,
        openQuestionsCount: 1,
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: "2026-07-02T11:00:00.000Z",
        availableFrom: "2026-08-01",
      },
    ]);

    await expect(getProviderListings()).resolves.toEqual([
      {
        id: "listing-1",
        title: "Wohnung in Berlin",
        displayAddress: "Musterstraße 1 · Berlin · 10115",
        coverImageUrl: "https://example.com/cover.jpg",
        coldRent: 1200,
        deposit: 2400,
        depositMonths: 2,
        livingArea: 70,
        rooms: 3,
        applicationsTotal: 4,
        openQuestionsCount: 1,
        status: "published",
        needsAttention: true,
        attentionReason: "open_questions",
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: "2026-07-02T11:00:00.000Z",
        availableFrom: "2026-08-01",
      },
    ]);
  });

  it("supports wrapped backend responses and skips invalid rows", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        { title: "Missing id" },
        {
          id: "listing-2",
          displayAddress: "Direkte Adresse",
          status: "draft",
        },
      ],
    });

    await expect(getProviderListings()).resolves.toEqual([
      {
        id: "listing-2",
        title: "Unbenanntes Objekt",
        displayAddress: "Direkte Adresse",
        coverImageUrl: null,
        coldRent: 0,
        deposit: 0,
        depositMonths: 0,
        livingArea: 0,
        rooms: 0,
        applicationsTotal: 0,
        openQuestionsCount: 0,
        status: "draft",
        needsAttention: false,
        attentionReason: null,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
        publishedAt: null,
        availableFrom: null,
      },
    ]);
  });

  it("publishes a provider listing", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await publishProviderListing("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/publish",
    );
  });

  it("moves a provider listing to draft", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await moveProviderListingToDraft("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/draft",
    );
  });

  it("archives a provider listing", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await archiveProviderListing("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/archive",
    );
  });
});
