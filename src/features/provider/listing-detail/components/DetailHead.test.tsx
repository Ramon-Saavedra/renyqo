import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ListingDetail } from "../types";
import { DetailHead } from "./DetailHead";

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

describe("DetailHead", () => {
  it("shows the status pill, object type chip, title and address", () => {
    render(<DetailHead listing={BASE} />);

    expect(screen.getByText("Entwurf")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Wohnung")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Wohnung in Berlin")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Musterstraße 1, 10115 Berlin")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows a published date for published listings", () => {
    render(
      <DetailHead
        listing={{
          ...BASE,
          status: "published",
          publishedAt: "2026-07-03T10:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Veröffentlicht")).toBeInstanceOf(HTMLElement);
  });
});
