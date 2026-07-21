import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingDetail } from "../types";
import { getProviderListing } from "../api/provider-listing-detail";
import { ListingDetailView } from "./ListingDetailView";

vi.mock("../api/provider-listing-detail", () => ({
  archiveProviderListing: vi.fn(),
  getProviderListing: vi.fn(),
  moveProviderListingToDraft: vi.fn(),
  publishProviderListing: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: "provider-1",
    name: "Mara Lehmann",
    email: "mara@example.com",
    role: "provider",
    providerType: "company",
    companyName: "Lehmann Wohnen",
  }),
  logout: vi.fn(),
}));

const BASE: ListingDetail = {
  id: "listing-1",
  title: "Wohnung in Berlin",
  status: "draft",
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
  images: [],
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: null,
};

describe("ListingDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProviderListing).mockResolvedValue(BASE);
  });

  it("links the logo to the provider dashboard", async () => {
    render(<ListingDetailView listingId="listing-1" />);

    expect(
      screen.getByRole("link", { name: "Renyqo" }).getAttribute("href"),
    ).toBe("/provider/dashboard");
    expect(await screen.findByText("Wohnung in Berlin")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("enters edit mode from the listing detail", async () => {
    const user = userEvent.setup();
    render(<ListingDetailView listingId="listing-1" />);

    await screen.findByRole("heading", { name: "Wohnung in Berlin" });
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));

    expect(
      await screen.findByRole("textbox", { name: "Objekttitel" }),
    ).toBeInstanceOf(HTMLInputElement);
  });
});
