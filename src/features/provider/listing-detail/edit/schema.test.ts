import { describe, expect, it } from "vitest";
import { listingEditCopy } from "./copy";
import { validateEditForm } from "./schema";
import type { ListingEditForm } from "./types";

const VALID: ListingEditForm = {
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
  bedrooms: "1",
  availableFrom: "2026-08-01",
  shortDescription: "Ruhige Lage",
  minimumHouseholdNetIncome: "3000",
  suitableForPeopleCount: 2,
  schufaRequired: true,
  incomeProofRequired: false,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
};

describe("validateEditForm", () => {
  it("passes a valid form", () => {
    expect(validateEditForm(VALID)).toEqual({});
  });

  it("requires a title", () => {
    expect(validateEditForm({ ...VALID, title: "   " })).toEqual({
      title: listingEditCopy.validation.title,
    });
  });

  it("rejects negative or non-numeric amounts", () => {
    const errors = validateEditForm({
      ...VALID,
      coldRent: "-5",
      rooms: "abc",
    });
    expect(errors.coldRent).toBe(listingEditCopy.validation.amount);
    expect(errors.rooms).toBe(listingEditCopy.validation.rooms);
  });

  it("allows empty optional numeric fields", () => {
    expect(
      validateEditForm({
        ...VALID,
        additionalCosts: "",
        deposit: "",
        minimumHouseholdNetIncome: "",
      }),
    ).toEqual({});
  });

  describe("bedrooms ≤ rooms relationship", () => {
    it("accepts bedrooms equal to rooms", () => {
      expect(validateEditForm({ ...VALID, rooms: "3", bedrooms: "3" })).toEqual(
        {},
      );
    });

    it("accepts bedrooms less than rooms", () => {
      expect(validateEditForm({ ...VALID, rooms: "3", bedrooms: "2" })).toEqual(
        {},
      );
    });

    it("accepts bedrooms with decimal rooms", () => {
      expect(
        validateEditForm({ ...VALID, rooms: "2.5", bedrooms: "2" }),
      ).toEqual({});
    });

    it("accepts bedrooms of 0", () => {
      expect(validateEditForm({ ...VALID, rooms: "1", bedrooms: "0" })).toEqual(
        {},
      );
    });

    it("rejects bedrooms greater than rooms", () => {
      const errors = validateEditForm({
        ...VALID,
        rooms: "2",
        bedrooms: "3",
      });
      expect(errors.bedrooms).toBe(listingEditCopy.validation.bedroomsTooMany);
    });

    it("rejects bedrooms greater than decimal rooms", () => {
      const errors = validateEditForm({
        ...VALID,
        rooms: "2.5",
        bedrooms: "3",
      });
      expect(errors.bedrooms).toBe(listingEditCopy.validation.bedroomsTooMany);
    });

    it("does not double-report when rooms is invalid", () => {
      const errors = validateEditForm({
        ...VALID,
        rooms: "abc",
        bedrooms: "3",
      });
      expect(errors.rooms).toBe(listingEditCopy.validation.rooms);
      expect(errors.bedrooms).toBeUndefined(); // individual rooms error, not relationship
    });
  });
});
