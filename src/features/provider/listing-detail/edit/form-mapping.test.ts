import { describe, expect, it } from "vitest";
import type { ListingDetail } from "../types";
import {
  applyEditFormToListing,
  isEditFormEqual,
  mapListingToEditForm,
  toDateInputValue,
} from "./form-mapping";

const LISTING: ListingDetail = {
  id: "listing-1",
  title: "Helle Wohnung",
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
  availableFrom: "2026-08-01T00:00:00.000Z",
  shortDescription: "Ruhige Lage",
  schufaRequired: true,
  incomeProofRequired: false,
  minimumHouseholdNetIncome: 3000,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
  images: ["https://example.com/photo.jpg"],
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: "2026-07-03T10:00:00.000Z",
};

describe("mapListingToEditForm", () => {
  it("projects a listing into editable form values", () => {
    expect(mapListingToEditForm(LISTING)).toEqual({
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
    });
  });

  it("falls back to defaults for nullable values", () => {
    const form = mapListingToEditForm({
      ...LISTING,
      objectType: null,
      street: null,
      zip: null,
      city: null,
      showExactAddress: null,
      coldRent: null,
      depositMonths: null,
      bedrooms: null,
      availableFrom: null,
      shortDescription: null,
      schufaRequired: null,
      petsPolicy: null,
    });

    expect(form.objectType).toBe("APARTMENT");
    expect(form.street).toBe("");
    expect(form.coldRent).toBe("");
    expect(form.depositMonths).toBeNull();
    expect(form.bedrooms).toBeNull();
    expect(form.availableFrom).toBe("");
    expect(form.shortDescription).toBe("");
    expect(form.schufaRequired).toBe(false);
    expect(form.petsPolicy).toBe("");
  });
});

describe("toDateInputValue", () => {
  it("normalizes ISO timestamps and plain dates", () => {
    expect(toDateInputValue("2026-08-01T12:34:56.000Z")).toBe("2026-08-01");
    expect(toDateInputValue("2026-08-01")).toBe("2026-08-01");
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue("not-a-date")).toBe("");
  });
});

describe("isEditFormEqual", () => {
  it("detects equality and differences", () => {
    const base = mapListingToEditForm(LISTING);
    expect(isEditFormEqual(base, { ...base })).toBe(true);
    expect(isEditFormEqual(base, { ...base, title: "Neu" })).toBe(false);
    expect(isEditFormEqual(base, { ...base, bedrooms: 2 })).toBe(false);
    expect(isEditFormEqual(base, { ...base, showExactAddress: true })).toBe(
      false,
    );
  });
});

describe("applyEditFormToListing", () => {
  it("projects edited values back and rebuilds the header address", () => {
    const form = {
      ...mapListingToEditForm(LISTING),
      title: "  Renoviert  ",
      street: "Neue Straße 5",
      city: "Hamburg",
      coldRent: "1350",
      petsPolicy: "" as const,
    };

    const updated = applyEditFormToListing(LISTING, form);

    expect(updated.title).toBe("Renoviert");
    expect(updated.coldRent).toBe(1350);
    expect(updated.headerAddress).toBe("Neue Straße 5, 10115 Hamburg");
    expect(updated.petsPolicy).toBeNull();
    expect(updated.updatedAt).not.toBe(LISTING.updatedAt);
  });
});
