import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet, apiPatchVoid } from "@/lib/api/client";
import { InvalidActiveApplicationsCountError } from "./parse-active-applications-count";
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

const baseListing = {
  id: "listing-1",
  title: "Wohnung in Berlin",
  objectType: "HOUSE",
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
  activeApplicationsCount: 4,
  openQuestionsCount: 1,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: "2026-07-02T11:00:00.000Z",
  availableFrom: "2026-08-01",
};

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
    vi.mocked(apiGet).mockResolvedValue([baseListing]);

    await expect(getProviderListings()).resolves.toEqual([
      {
        id: "listing-1",
        title: "Wohnung in Berlin",
        objectType: "HOUSE",
        displayAddress: "Musterstraße 1 · Berlin · 10115",
        coverImageUrl: "https://example.com/cover.jpg",
        coldRent: 1200,
        deposit: 2400,
        depositMonths: 2,
        livingArea: 70,
        rooms: 3,
        activeApplicationsCount: 4,
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

  it.each([0, 1, 5] as const)(
    "accepts activeApplicationsCount %i",
    async (count) => {
      vi.mocked(apiGet).mockResolvedValue([
        { ...baseListing, activeApplicationsCount: count },
      ]);

      const listings = await getProviderListings();
      expect(listings[0]?.activeApplicationsCount).toBe(count);
    },
  );

  it("rejects a missing activeApplicationsCount without dropping the listing silently", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...baseListing, activeApplicationsCount: undefined },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects null activeApplicationsCount", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...baseListing, activeApplicationsCount: null },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects string activeApplicationsCount", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...baseListing, activeApplicationsCount: "3" },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects negative activeApplicationsCount", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...baseListing, activeApplicationsCount: -1 },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects activeApplicationsCount above 5", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...baseListing, activeApplicationsCount: 6 },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("does not infer ACTIVE from applicationsTotal aliases", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        ...baseListing,
        activeApplicationsCount: undefined,
        applicationsTotal: 4,
        applicationsCount: 4,
        applicationCount: 4,
      },
    ]);

    await expect(getProviderListings()).rejects.toBeInstanceOf(
      InvalidActiveApplicationsCountError,
    );
  });

  it("supports wrapped backend responses and skips invalid rows without id", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        { title: "Missing id", activeApplicationsCount: 1 },
        {
          id: "listing-2",
          displayAddress: "Direkte Adresse",
          status: "draft",
          activeApplicationsCount: 0,
        },
      ],
    });

    await expect(getProviderListings()).resolves.toEqual([
      {
        id: "listing-2",
        title: "Unbenanntes Objekt",
        objectType: null,
        displayAddress: "Direkte Adresse",
        coverImageUrl: null,
        coldRent: 0,
        deposit: 0,
        depositMonths: 0,
        livingArea: 0,
        rooms: 0,
        activeApplicationsCount: 0,
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
