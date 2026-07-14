import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ListingDetail } from "../types";
import { RequirementsCard } from "./RequirementsCard";

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

describe("RequirementsCard", () => {
  it("shows all applicant requirement fields with their values", () => {
    render(<RequirementsCard listing={BASE} />);

    expect(screen.getByText("Mindesteinkommen netto")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("3.000 €")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("SCHUFA-Auskunft")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Erforderlich")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Einkommensnachweis")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Nicht erforderlich")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Passend für insgesamt")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("Max. 2 Personen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Haustiere")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Nach Absprache")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Rauchen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Nichtraucher bevorzugt")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows a dash for applicant requirement fields without values", () => {
    render(
      <RequirementsCard
        listing={{
          ...BASE,
          schufaRequired: null,
          incomeProofRequired: null,
          minimumHouseholdNetIncome: null,
          suitableForPeopleCount: null,
          petsPolicy: null,
          smokingPolicy: null,
        }}
      />,
    );

    expect(screen.getAllByText("-")).toHaveLength(6);
  });
});
