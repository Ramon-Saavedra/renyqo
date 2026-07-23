import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import {
  getProviderListing,
  mapProviderListingDetail,
} from "./provider-listing-detail";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

describe("mapProviderListingDetail", () => {
  it("maps a backend listing detail response", () => {
    expect(
      mapProviderListingDetail({
        id: "listing-1",
        title: "Wohnung in Berlin",
        status: "PUBLISHED",
        objectType: "APARTMENT",
        street: "Musterstraße 1",
        zip: "10115",
        city: "Berlin",
        showExactAddress: false,
        coldRent: "1200",
        additionalCosts: 180,
        deposit: 2400,
        depositMonths: 2,
        livingArea: "70",
        rooms: "2.5",
        bedrooms: 1,
        availableFrom: "2026-08-01",
        shortDescription: "Helle Wohnung",
        schufaRequired: true,
        incomeProofRequired: false,
        minimumHouseholdNetIncome: "3000",
        suitableForPeopleCount: 2,
        petsPolicy: "BY_ARRANGEMENT",
        smokingPolicy: "NON_SMOKERS_PREFERRED",
        images: [
          {
            id: "img-1",
            secureUrl: "https://example.com/photo.jpg",
            position: 0,
            isCover: true,
          },
        ],
        createdAt: "2026-07-01T10:00:00.000Z",
        updatedAt: "2026-07-02T10:00:00.000Z",
        publishedAt: "2026-07-03T10:00:00.000Z",
      }),
    ).toEqual({
      id: "listing-1",
      title: "Wohnung in Berlin",
      status: "published",
      objectType: "APARTMENT",
      street: "Musterstraße 1",
      zip: "10115",
      city: "Berlin",
      showExactAddress: false,
      headerAddress: "Musterstraße 1, 10115 Berlin",
      coldRent: 1200,
      additionalCosts: 180,
      deposit: 2400,
      depositMonths: 2,
      livingArea: 70,
      rooms: 2.5,
      bedrooms: 1,
      availableFrom: "2026-08-01",
      shortDescription: "Helle Wohnung",
      schufaRequired: true,
      incomeProofRequired: false,
      minimumHouseholdNetIncome: 3000,
      suitableForPeopleCount: 2,
      petsPolicy: "BY_ARRANGEMENT",
      smokingPolicy: "NON_SMOKERS_PREFERRED",
      images: [
        {
          id: "img-1",
          secureUrl: "https://example.com/photo.jpg",
          position: 0,
          isCover: true,
        },
      ],
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-02T10:00:00.000Z",
      publishedAt: "2026-07-03T10:00:00.000Z",
    });
  });

  it("supports wrapped responses and rejects invalid payloads", () => {
    expect(
      mapProviderListingDetail({
        data: {
          id: "listing-2",
          displayAddress: "Direkte Adresse",
          status: "ARCHIVED",
        },
      }),
    ).toMatchObject({
      id: "listing-2",
      title: "Unbenanntes Objekt",
      status: "archived",
      headerAddress: "Direkte Adresse",
    });

    expect(mapProviderListingDetail({ title: "Missing id" })).toBeNull();
  });
});

describe("getProviderListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a provider listing detail from the backend endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      id: "listing-1",
      title: "Wohnung",
    });

    await expect(getProviderListing("listing-1")).resolves.toMatchObject({
      id: "listing-1",
      title: "Wohnung",
    });

    expect(apiGet).toHaveBeenCalledWith("/api/v1/provider/listings/listing-1");
  });

  it("throws when the backend detail response cannot be parsed", async () => {
    vi.mocked(apiGet).mockResolvedValue({ title: "Missing id" });

    await expect(getProviderListing("listing-1")).rejects.toThrow(
      "Listing detail response could not be parsed",
    );
  });
});
