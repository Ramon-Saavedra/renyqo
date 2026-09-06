import { describe, expect, it } from "vitest";
import { formatArea, formatEUR } from "./format";
import {
  digitsOnly,
  formatMaxRentChoice,
  formatMinAreaChoice,
  isCustomFilterValue,
  parseFilterInteger,
} from "./filter-value";

const OPTIONS = [
  { value: null, label: "Egal" },
  { value: 800, label: "bis 800 €" },
  { value: 1000, label: "bis 1.000 €" },
] as const;

describe("parseFilterInteger", () => {
  it("returns null for empty input", () => {
    expect(parseFilterInteger("")).toBeNull();
    expect(parseFilterInteger("  ")).toBeNull();
  });

  it("returns null for zero, negatives, and non-integers", () => {
    expect(parseFilterInteger("0")).toBeNull();
    expect(parseFilterInteger("-12")).toBeNull();
    expect(parseFilterInteger("12.5")).toBeNull();
    expect(parseFilterInteger("abc")).toBeNull();
  });

  it("parses positive integers", () => {
    expect(parseFilterInteger("1150")).toBe(1150);
    expect(parseFilterInteger(" 72 ")).toBe(72);
  });
});

describe("digitsOnly", () => {
  it("strips non-digit characters", () => {
    expect(digitsOnly("-1.150 €")).toBe("1150");
  });
});

describe("isCustomFilterValue", () => {
  it("is false for null and preset values", () => {
    expect(isCustomFilterValue(OPTIONS, null)).toBe(false);
    expect(isCustomFilterValue(OPTIONS, 800)).toBe(false);
  });

  it("is true for values outside the preset list", () => {
    expect(isCustomFilterValue(OPTIONS, 1150)).toBe(true);
  });
});

describe("formatMaxRentChoice", () => {
  it("uses the existing euro formatter", () => {
    expect(formatMaxRentChoice(1150)).toBe(`bis ${formatEUR(1150)}`);
  });
});

describe("formatMinAreaChoice", () => {
  it("uses the existing area formatter", () => {
    expect(formatMinAreaChoice(72)).toBe(`ab ${formatArea(72)}`);
  });
});
