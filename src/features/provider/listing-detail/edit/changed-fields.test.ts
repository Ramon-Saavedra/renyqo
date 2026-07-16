import { describe, expect, it } from "vitest";
import { getChangedFields } from "./changed-fields";
import type { ListingEditForm } from "./types";

const FORM: ListingEditForm = {
  title: "Helle Wohnung",
  objectType: "APARTMENT",
  street: "Musterstraße 1",
  zip: "10115",
  city: "Berlin",
  showExactAddress: false,
  coldRent: "1200",
  additionalCosts: "180",
  deposit: "2400",
  depositMonths: 2,
  livingArea: "70",
  rooms: "2.5",
  bedrooms: 1,
  availableFrom: "2026-08-01",
  shortDescription: "Ruhige Lage",
  minimumHouseholdNetIncome: "3000",
  suitableForPeopleCount: 2,
  schufaRequired: true,
  incomeProofRequired: false,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
};

describe("getChangedFields", () => {
  it("is empty when nothing changed", () => {
    expect(getChangedFields(FORM, FORM).size).toBe(0);
  });

  it("reports only the fields that differ", () => {
    const next: ListingEditForm = {
      ...FORM,
      coldRent: "1350",
      city: "Hamburg",
    };

    expect([...getChangedFields(next, FORM)].sort()).toEqual([
      "city",
      "coldRent",
    ]);
  });

  it("reports nullable and boolean fields", () => {
    const next: ListingEditForm = {
      ...FORM,
      bedrooms: null,
      schufaRequired: false,
    };

    expect([...getChangedFields(next, FORM)].sort()).toEqual([
      "bedrooms",
      "schufaRequired",
    ]);
  });
});
