import { describe, expect, it } from "vitest";
import type { ListingEditForm } from "./types";
import {
  hasPayloadChanges,
  mapEditFormToUpdatePayload,
} from "./payload-mapping";

const INITIAL: ListingEditForm = {
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

describe("mapEditFormToUpdatePayload", () => {
  it("returns an empty payload when nothing changed", () => {
    const payload = mapEditFormToUpdatePayload({ ...INITIAL }, INITIAL);
    expect(payload).toEqual({});
    expect(hasPayloadChanges(payload)).toBe(false);
  });

  it("includes only the changed fields", () => {
    const payload = mapEditFormToUpdatePayload(
      {
        ...INITIAL,
        title: "  Renovierte Wohnung ",
        coldRent: "1350",
        bedrooms: "2",
        schufaRequired: false,
      },
      INITIAL,
    );

    expect(payload).toEqual({
      title: "Renovierte Wohnung",
      coldRent: 1350,
      bedrooms: 2,
      schufaRequired: false,
    });
    expect(hasPayloadChanges(payload)).toBe(true);
  });

  it("converts the availability date to an ISO timestamp", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, availableFrom: "2026-09-15" },
      INITIAL,
    );
    expect(payload.availableFrom).toBe("2026-09-15T00:00:00.000Z");
  });

  it("clears the minimum income to null but skips empty enum selections", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, minimumHouseholdNetIncome: "", petsPolicy: "" },
      INITIAL,
    );
    expect(payload.minimumHouseholdNetIncome).toBeNull();
    expect("petsPolicy" in payload).toBe(false);
  });

  it("skips invalid numeric input for required numeric fields", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, coldRent: "" },
      INITIAL,
    );
    expect("coldRent" in payload).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, availableFrom: "2026-02-31" },
      INITIAL,
    );
    expect("availableFrom" in payload).toBe(false);
  });

  it("rejects a date in wrong format", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, availableFrom: "31.08.2026" },
      INITIAL,
    );
    expect("availableFrom" in payload).toBe(false);
  });

  it("rejects an empty availableFrom", () => {
    const payload = mapEditFormToUpdatePayload(
      { ...INITIAL, availableFrom: "" },
      INITIAL,
    );
    expect("availableFrom" in payload).toBe(false);
  });

  describe("optional eligibility criteria", () => {
    it("omits both criteria when they are unchanged", () => {
      const payload = mapEditFormToUpdatePayload({ ...INITIAL }, INITIAL);

      expect(payload).not.toHaveProperty("minimumHouseholdNetIncome");
      expect(payload).not.toHaveProperty("suitableForPeopleCount");
    });

    it("clears a deliberately emptied people count with null", () => {
      const payload = mapEditFormToUpdatePayload(
        { ...INITIAL, suitableForPeopleCount: null },
        INITIAL,
      );

      expect(payload.suitableForPeopleCount).toBeNull();
    });

    it("sends an income of 0 instead of dropping it", () => {
      const payload = mapEditFormToUpdatePayload(
        { ...INITIAL, minimumHouseholdNetIncome: "0" },
        INITIAL,
      );

      expect(payload.minimumHouseholdNetIncome).toBe(0);
    });

    it("sends a people count of 1 instead of dropping it", () => {
      const payload = mapEditFormToUpdatePayload(
        { ...INITIAL, suitableForPeopleCount: 1 },
        INITIAL,
      );

      expect(payload.suitableForPeopleCount).toBe(1);
    });

    it("never clears the income because the input was invalid", () => {
      const payload = mapEditFormToUpdatePayload(
        { ...INITIAL, minimumHouseholdNetIncome: "abc" },
        INITIAL,
      );

      expect(payload).not.toHaveProperty("minimumHouseholdNetIncome");
    });

    it("never clears the people count because the value was a decimal", () => {
      const payload = mapEditFormToUpdatePayload(
        { ...INITIAL, suitableForPeopleCount: 2.5 },
        INITIAL,
      );

      expect(payload).not.toHaveProperty("suitableForPeopleCount");
    });
  });
});
