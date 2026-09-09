import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters, SortKey } from "../types";
import {
  LISTINGS_SEARCH_QUERY_MAX_LENGTH,
  LISTINGS_SEARCH_SESSION_KEY,
  clampListingsSearchQuery,
  clearListingsSearchSession,
  listingsSearchBackHref,
  listingsSearchHref,
  parseListingsSearchParams,
  persistListingsSearchQuery,
  serializeListingsSearchQuery,
} from "./listings-search-params";

function filters(overrides: Partial<ListingFilters> = {}): ListingFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

function roundTrip(nextFilters: ListingFilters, sort: SortKey) {
  const query = serializeListingsSearchQuery(nextFilters, sort);
  return parseListingsSearchParams(new URLSearchParams(query));
}

describe("listings search params", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("serializes empty filters to an empty query string", () => {
    expect(serializeListingsSearchQuery(EMPTY_FILTERS, "newest")).toBe("");
    expect(listingsSearchHref(EMPTY_FILTERS, "newest")).toBe("/listings");
  });

  it("persists search query, onlyMatching, numeric and date filters, and sort", () => {
    const next = filters({
      query: "Freiburg",
      maxColdRent: 1300,
      minRooms: 3,
      minLivingArea: 80,
      availableFrom: "2026-09-01",
      onlyMatching: true,
    });

    expect(serializeListingsSearchQuery(next, "price-asc")).toBe(
      "query=Freiburg&maxRent=1300&minRooms=3&minLivingArea=80&availableBy=2026-09-01&onlyMatching=1&sort=price-asc",
    );
    expect(listingsSearchHref(next, "price-asc")).toBe(
      "/listings?query=Freiburg&maxRent=1300&minRooms=3&minLivingArea=80&availableBy=2026-09-01&onlyMatching=1&sort=price-asc",
    );
  });

  it("round-trips a complete search state", () => {
    const next = filters({
      query: "Rieselfeld",
      maxColdRent: 1000,
      minRooms: 2,
      minLivingArea: 50,
      availableFrom: "2026-10-15",
      onlyMatching: true,
    });
    expect(roundTrip(next, "area-desc")).toEqual({
      filters: next,
      sort: "area-desc",
    });
  });

  it("parses onlyMatching from 1 or true and ignores other values", () => {
    expect(
      parseListingsSearchParams(new URLSearchParams("onlyMatching=1")).filters
        .onlyMatching,
    ).toBe(true);
    expect(
      parseListingsSearchParams(new URLSearchParams("onlyMatching=true"))
        .filters.onlyMatching,
    ).toBe(true);
    expect(
      parseListingsSearchParams(new URLSearchParams("onlyMatching=false"))
        .filters.onlyMatching,
    ).toBe(false);
  });

  it("ignores invalid numeric, date, and sort values", () => {
    const parsed = parseListingsSearchParams(
      new URLSearchParams(
        "query=Berlin&maxRent=abc&minRooms=-1&minLivingArea=0&availableBy=01.09.2026&sort=popular",
      ),
    );

    expect(parsed).toEqual({
      filters: {
        query: "Berlin",
        maxColdRent: null,
        minRooms: null,
        minLivingArea: null,
        availableFrom: null,
        onlyMatching: false,
      },
      sort: "newest",
    });
  });

  it("omits default sort from the serialized query", () => {
    expect(
      serializeListingsSearchQuery(filters({ query: "Köln" }), "newest"),
    ).toBe("query=K%C3%B6ln");
  });

  it("trims the search query when writing and reading the URL", () => {
    expect(
      serializeListingsSearchQuery(
        filters({ query: "  Freiburg  " }),
        "newest",
      ),
    ).toBe("query=Freiburg");
    expect(
      parseListingsSearchParams(new URLSearchParams("query=%20Freiburg%20"))
        .filters.query,
    ).toBe("Freiburg");
  });

  it("persists a sanitized listings search for the detail back link", () => {
    persistListingsSearchQuery("query=Freiburg&onlyMatching=1&unknown=drop-me");
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Freiburg&onlyMatching=1&unknown=drop-me",
    );
    expect(listingsSearchBackHref()).toBe(
      "/listings?query=Freiburg&onlyMatching=1",
    );

    persistListingsSearchQuery("");
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBeNull();
    expect(listingsSearchBackHref()).toBe("/listings");
  });

  it("clamps an oversized search query on parse and serialize", () => {
    const oversized = `${"a".repeat(LISTINGS_SEARCH_QUERY_MAX_LENGTH)}extra`;
    const limited = "a".repeat(LISTINGS_SEARCH_QUERY_MAX_LENGTH);

    expect(clampListingsSearchQuery(oversized)).toBe(limited);
    expect(
      parseListingsSearchParams(new URLSearchParams(`query=${oversized}`))
        .filters.query,
    ).toBe(limited);
    expect(
      serializeListingsSearchQuery(filters({ query: oversized }), "newest"),
    ).toBe(`query=${limited}`);
  });

  it("clears the persisted listings search session", () => {
    persistListingsSearchQuery("query=Freiburg");
    clearListingsSearchSession();
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBeNull();
    expect(listingsSearchBackHref()).toBe("/listings");
  });
});
