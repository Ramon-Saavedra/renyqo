import { describe, expect, it } from "vitest";

import { EMPTY_FILTERS } from "../types";
import type { ListingFilters } from "../types";
import { countActiveFilters, hasActiveFilters } from "./filter";

function withFilters(patch: Partial<ListingFilters>): ListingFilters {
  return { ...EMPTY_FILTERS, ...patch };
}

describe("countActiveFilters", () => {
  it("ignores the search query", () => {
    expect(countActiveFilters(withFilters({ query: "Freiburg" }))).toBe(0);
  });

  it("counts each narrowed filter", () => {
    expect(
      countActiveFilters(
        withFilters({ minRooms: 2, maxColdRent: 900, onlyMatching: true }),
      ),
    ).toBe(3);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("is true when only a query is present", () => {
    expect(hasActiveFilters(withFilters({ query: "Freiburg" }))).toBe(true);
  });

  it("ignores a whitespace-only query", () => {
    expect(hasActiveFilters(withFilters({ query: "   " }))).toBe(false);
  });
});
