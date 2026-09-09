import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FILTERS } from "../types";
import { LISTINGS_SEARCH_SESSION_KEY } from "../utils/listings-search-params";
import { useListingsSearchState } from "./useListingsSearchState";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
  usePathname: () => "/listings",
}));

describe("useListingsSearchState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    sessionStorage.clear();
  });

  it("reads the current search params as the initial filter state", () => {
    searchParams = new URLSearchParams(
      "query=Freiburg&onlyMatching=1&sort=price-desc",
    );

    const { result } = renderHook(() => useListingsSearchState());

    expect(result.current.filters).toEqual({
      ...EMPTY_FILTERS,
      query: "Freiburg",
      onlyMatching: true,
    });
    expect(result.current.sort).toBe("price-desc");
    expect(replace).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Freiburg&onlyMatching=1&sort=price-desc",
    );
  });

  it("writes filter changes to the listings URL without scrolling", () => {
    const { result } = renderHook(() => useListingsSearchState());

    act(() => {
      result.current.updateFilters({ query: "Freiburg", onlyMatching: true });
    });

    expect(replace).toHaveBeenCalledWith(
      "/listings?query=Freiburg&onlyMatching=1",
      { scroll: false },
    );
    expect(result.current.filters.query).toBe("Freiburg");
    expect(result.current.filters.onlyMatching).toBe(true);
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Freiburg&onlyMatching=1",
    );
  });

  it("restores filters when the URL search params change", () => {
    searchParams = new URLSearchParams("query=Freiburg");
    const { result, rerender } = renderHook(() => useListingsSearchState());

    expect(result.current.filters.query).toBe("Freiburg");

    searchParams = new URLSearchParams();
    rerender();

    expect(result.current.filters).toEqual(EMPTY_FILTERS);
    expect(result.current.sort).toBe("newest");
  });

  it("resets filters while keeping the current sort in the URL", () => {
    searchParams = new URLSearchParams("query=Freiburg&sort=price-asc");
    const { result } = renderHook(() => useListingsSearchState());

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual(EMPTY_FILTERS);
    expect(replace).toHaveBeenCalledWith("/listings?sort=price-asc", {
      scroll: false,
    });
  });

  it("does not revert in-progress typing when a stale URL update arrives", () => {
    const { result, rerender } = renderHook(() => useListingsSearchState());

    act(() => {
      result.current.updateFilters({ query: "F" });
    });
    act(() => {
      result.current.updateFilters({ query: "Fr" });
    });

    expect(result.current.filters.query).toBe("Fr");
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Fr",
    );

    searchParams = new URLSearchParams("query=F");
    rerender();

    expect(result.current.filters.query).toBe("Fr");
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Fr",
    );

    searchParams = new URLSearchParams("query=Fr");
    rerender();

    expect(result.current.filters.query).toBe("Fr");
  });

  it("restores filters from back/forward after a write has settled", () => {
    const { result, rerender } = renderHook(() => useListingsSearchState());

    act(() => {
      result.current.updateFilters({ query: "Freiburg" });
    });

    searchParams = new URLSearchParams("query=Freiburg");
    rerender();

    searchParams = new URLSearchParams();
    rerender();

    expect(result.current.filters).toEqual(EMPTY_FILTERS);
    expect(result.current.sort).toBe("newest");
  });
});
