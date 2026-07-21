import { describe, expect, it } from "vitest";

import {
  isConfiguredCriterion,
  parseMinimumHouseholdNetIncome,
  parseSuitableForPeopleCount,
} from "./eligibility-criteria";

describe("parseMinimumHouseholdNetIncome", () => {
  it("treats an empty string as not configured", () => {
    expect(parseMinimumHouseholdNetIncome("")).toBeUndefined();
  });

  it("treats a whitespace-only string as not configured", () => {
    expect(parseMinimumHouseholdNetIncome("   ")).toBeUndefined();
  });

  it("preserves a configured income of 0", () => {
    expect(parseMinimumHouseholdNetIncome("0")).toBe(0);
  });

  it("parses a plain amount", () => {
    expect(parseMinimumHouseholdNetIncome("2500")).toBe(2500);
  });

  it("parses a German decimal comma", () => {
    expect(parseMinimumHouseholdNetIncome("1200,50")).toBe(1200.5);
  });

  it("rejects a non-numeric amount instead of falling back to 0", () => {
    expect(parseMinimumHouseholdNetIncome("abc")).toBeNull();
  });

  it("rejects a negative amount", () => {
    expect(parseMinimumHouseholdNetIncome("-1")).toBeNull();
  });

  it("never returns the Number('') result of 0 for an empty input", () => {
    expect(parseMinimumHouseholdNetIncome("")).not.toBe(0);
  });
});

describe("parseSuitableForPeopleCount", () => {
  it("treats null as not configured", () => {
    expect(parseSuitableForPeopleCount(null)).toBeUndefined();
  });

  it("preserves a configured count of 1", () => {
    expect(parseSuitableForPeopleCount(1)).toBe(1);
  });

  it("parses a higher count", () => {
    expect(parseSuitableForPeopleCount(4)).toBe(4);
  });

  it("rejects a decimal count", () => {
    expect(parseSuitableForPeopleCount(2.5)).toBeNull();
  });

  it("rejects 0 because a listing suits at least one person", () => {
    expect(parseSuitableForPeopleCount(0)).toBeNull();
  });

  it("rejects a negative count", () => {
    expect(parseSuitableForPeopleCount(-3)).toBeNull();
  });

  it("rejects NaN", () => {
    expect(parseSuitableForPeopleCount(Number.NaN)).toBeNull();
  });
});

describe("isConfiguredCriterion", () => {
  it("accepts 0", () => {
    expect(isConfiguredCriterion(0)).toBe(true);
  });

  it("rejects not-configured", () => {
    expect(isConfiguredCriterion(undefined)).toBe(false);
  });

  it("rejects invalid", () => {
    expect(isConfiguredCriterion(null)).toBe(false);
  });
});
