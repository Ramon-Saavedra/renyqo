import { describe, expect, it, vi } from "vitest";

import { apiPost } from "./client";
import { extractListingFromText } from "./listing-assistance";

vi.mock("./client", () => ({
  apiPost: vi.fn(),
  apiPostFormData: vi.fn(),
}));

describe("extractListingFromText", () => {
  it("returns a validated extraction result", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      values: {
        objectType: "HOUSE",
        city: "Berlin",
        zip: "44444",
        street: "Rabenstraße",
        livingArea: 100,
        rooms: 5,
        bedrooms: 3,
        coldRent: 1000,
        availableFrom: "2027-01-20",
        minimumHouseholdNetIncome: 3000,
        incomeProofRequired: true,
        suitableForPeopleCount: 2,
        petsPolicy: "NOT_ALLOWED",
        smokingPolicy: "NON_SMOKERS_PREFERRED",
      },
      requiredMissingFields: [],
      recommendedMissingFields: ["schufaRequired"],
      inconsistencies: [],
      warnings: [],
    });

    await expect(
      extractListingFromText("Haus in Berlin"),
    ).resolves.toMatchObject({
      values: { city: "Berlin", petsPolicy: "NOT_ALLOWED" },
      recommendedMissingFields: ["schufaRequired"],
    });
  });

  it("rejects malformed extraction results", async () => {
    vi.mocked(apiPost).mockResolvedValue({ values: { city: 42 } });

    await expect(extractListingFromText("Wohnung")).rejects.toThrow();
  });
});
