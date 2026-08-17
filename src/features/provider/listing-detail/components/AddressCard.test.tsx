import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ListingDetail } from "../types";
import { AddressCard } from "./AddressCard";

const BASE_LISTING: ListingDetail = {
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
  images: [],
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: "2026-07-03T10:00:00.000Z",
};

describe("AddressCard", () => {
  it("explains that the exact address is hidden from applicants", () => {
    render(<AddressCard listing={BASE_LISTING} />);

    expect(
      screen.getByText(
        "Die genaue Adresse ist nur für dich sichtbar. Bewerbende sehen zunächst nur Stadt und ungefähre Lage. Du kannst die vollständige Adresse jederzeit unter „Bearbeiten“ freigeben.",
      ),
    ).toBeInstanceOf(HTMLParagraphElement);
  });

  it("explains that the exact address is visible to applicants", () => {
    render(
      <AddressCard listing={{ ...BASE_LISTING, showExactAddress: true }} />,
    );

    expect(
      screen.getByText(
        "Die genaue Adresse ist öffentlich sichtbar. Bewerbende sehen sie in der Suche und in der Objektansicht. Du kannst die Sichtbarkeit jederzeit unter „Bearbeiten“ ändern.",
      ),
    ).toBeInstanceOf(HTMLParagraphElement);
  });

  it("asks the provider to verify an unknown visibility setting", () => {
    render(
      <AddressCard listing={{ ...BASE_LISTING, showExactAddress: null }} />,
    );

    expect(
      screen.getByText(
        "Die Sichtbarkeit der genauen Adresse konnte nicht ermittelt werden. Bitte prüfe die Einstellung unter „Bearbeiten“.",
      ),
    ).toBeInstanceOf(HTMLParagraphElement);
  });
});
