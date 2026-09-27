import { describe, expect, it } from "vitest";

import {
  InvalidActiveApplicationsCountError,
  parseActiveApplicationsCount,
} from "./parse-active-applications-count";

describe("parseActiveApplicationsCount", () => {
  it.each([0, 1, 5, 25] as const)("accepts valid count %i", (value) => {
    expect(parseActiveApplicationsCount(value)).toBe(value);
  });

  it("rejects a missing field", () => {
    expect(() => parseActiveApplicationsCount(undefined)).toThrow(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects null", () => {
    expect(() => parseActiveApplicationsCount(null)).toThrow(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects strings", () => {
    expect(() => parseActiveApplicationsCount("3")).toThrow(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects non-integers", () => {
    expect(() => parseActiveApplicationsCount(1.5)).toThrow(
      InvalidActiveApplicationsCountError,
    );
  });

  it("rejects negative values", () => {
    expect(() => parseActiveApplicationsCount(-1)).toThrow(
      InvalidActiveApplicationsCountError,
    );
  });

  it("accepts values above the visual capacity", () => {
    expect(parseActiveApplicationsCount(6)).toBe(6);
  });
});
