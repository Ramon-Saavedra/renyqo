import { describe, expect, it } from "vitest";

import { publishSchema } from "./listing-schemas";

const validInput = {
  city: "Berlin",
  zip: "10115",
  street: "Musterstraße 1",
  area: "65",
  rooms: "3",
  bedrooms: 1,
  price: "1100",
  additionalCosts: "0",
  depositMonths: 2,
  availableFrom: "2026-07-01",
  minIncome: "",
  peopleCount: null,
  legalAccepted: true,
};

describe("publishSchema", () => {
  it("accepts valid numeric values, zero additional costs and a real date", () => {
    expect(publishSchema.safeParse(validInput).success).toBe(true);
  });

  it.each([
    ["area", "0"],
    ["area", "-10"],
    ["rooms", "0"],
    ["price", "0"],
    ["availableFrom", "2026-02-31"],
  ])("rejects invalid %s value %s", (field, value) => {
    const result = publishSchema.safeParse({ ...validInput, [field]: value });

    expect(result.success).toBe(false);
  });

  it("accepts the six-plus rooms option", () => {
    expect(
      publishSchema.safeParse({ ...validInput, rooms: "6+" }).success,
    ).toBe(true);
  });

  describe("optional eligibility criteria", () => {
    it("accepts unconfigured criteria", () => {
      const result = publishSchema.safeParse({
        ...validInput,
        minIncome: "",
        peopleCount: null,
      });

      expect(result.success).toBe(true);
    });

    it("accepts an income of 0 and a people count of 1", () => {
      const result = publishSchema.safeParse({
        ...validInput,
        minIncome: "0",
        peopleCount: 1,
      });

      expect(result.success).toBe(true);
    });

    it("blocks publishing on an invalid income", () => {
      const result = publishSchema.safeParse({
        ...validInput,
        minIncome: "abc",
      });

      expect(result.success).toBe(false);
    });

    it("blocks publishing on a decimal people count", () => {
      const result = publishSchema.safeParse({
        ...validInput,
        peopleCount: 2.5,
      });

      expect(result.success).toBe(false);
    });
  });
});
