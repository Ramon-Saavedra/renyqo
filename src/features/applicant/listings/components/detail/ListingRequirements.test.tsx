import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublicListingDetail } from "../../types";
import { ListingRequirements } from "./ListingRequirements";

function mockListing(
  overrides: Partial<PublicListingDetail> = {},
): PublicListingDetail {
  return {
    id: "l1",
    title: "Wohnung",
    location: "Berlin",
    rooms: 2,
    livingArea: 50,
    availableFrom: null,
    coldRent: 800,
    additionalCosts: 100,
    matchesProfile: "match",
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
    isNew: false,
    publishedAt: "2026-01-01",
    street: null,
    zip: null,
    city: null,
    district: null,
    objectType: "APARTMENT",
    bedrooms: 1,
    deposit: null,
    depositMonths: null,
    shortDescription: null,
    images: [],
    schufaRequired: false,
    incomeProofRequired: false,
    suitableForPeopleCount: null,
    petsPolicy: null,
    smokingPolicy: null,
    ...overrides,
  };
}

describe("ListingRequirements", () => {
  it("renders a row for each provided requirement", () => {
    render(
      <ListingRequirements
        listing={mockListing({
          schufaRequired: true,
          suitableForPeopleCount: 2,
          petsPolicy: "NOT_ALLOWED",
          smokingPolicy: "NOT_ALLOWED",
        })}
      />,
    );

    expect(screen.queryByText("Mindesteinkommen (netto)")).toBeNull();
    expect(screen.queryByText("2.500 €")).toBeNull();
    expect(screen.getByText("SCHUFA")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Erforderlich")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Haushaltsgröße")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("1–2 Personen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Haustiere")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Rauchen")).toBeInstanceOf(HTMLElement);
  });

  it("renders required boolean rows when optional requirements are null", () => {
    render(<ListingRequirements listing={mockListing()} />);

    expect(screen.getByText("SCHUFA")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Einkommensnachweis")).toBeInstanceOf(HTMLElement);
  });

  it("labels required and not required values correctly", () => {
    render(
      <ListingRequirements
        listing={mockListing({
          incomeProofRequired: true,
          schufaRequired: false,
        })}
      />,
    );

    const required = screen.getAllByText("Erforderlich");
    expect(required).toHaveLength(1);

    expect(screen.getByText("Nicht erforderlich")).toBeInstanceOf(HTMLElement);
  });
});
