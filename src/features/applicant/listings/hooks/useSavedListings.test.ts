import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSavedListings } from "../api/saved-listings";
import type { PublicListing, PublicListingsResponse } from "../types";
import { useSavedListings } from "./useSavedListings";

vi.mock("../api/saved-listings", () => ({
  getSavedListings: vi.fn(),
}));

function listing(id: string): PublicListing {
  return {
    id,
    title: "",
    location: "",
    rooms: 0,
    livingArea: 0,
    availableFrom: null,
    coldRent: 0,
    serviceCharge: 0,
    matchesProfile: null,
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: true,
    isNew: false,
    coverImageUrl: null,
    publishedAt: "",
  };
}

function mockResponse(
  overrides: Partial<PublicListingsResponse> = {},
): PublicListingsResponse {
  return {
    listings: [],
    total: 0,
    nextCursor: null,
    ...overrides,
  };
}

describe("useSavedListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading-page state", () => {
    vi.mocked(getSavedListings).mockResolvedValue(mockResponse());

    const { result } = renderHook(() => useSavedListings());

    expect(result.current.fetchStatus).toBe("loading-page");
  });

  it("loads the first page without filters", async () => {
    vi.mocked(getSavedListings).mockResolvedValue(
      mockResponse({ listings: [listing("l1")], total: 1 }),
    );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(getSavedListings).toHaveBeenCalledWith(
      { limit: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.listings).toHaveLength(1);
    expect(result.current.listings[0]?.isSaved).toBe(true);
  });

  it("transitions to error-page on network failure", async () => {
    vi.mocked(getSavedListings).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("error-page");
    });

    expect(result.current.listings).toHaveLength(0);
  });

  it("loads more when loadMore is called and appends results", async () => {
    vi.mocked(getSavedListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l1")],
          total: 3,
          nextCursor: "c1",
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l2"), listing("l3")],
          total: 3,
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.listings).toHaveLength(3);
    });

    expect(getSavedListings).toHaveBeenLastCalledWith(
      { limit: 20, cursor: "c1" },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.nextCursor).toBeNull();
    expect(result.current.total).toBe(3);
  });

  it("transitions to error-more when loadMore fails", async () => {
    vi.mocked(getSavedListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l1")],
          total: 2,
          nextCursor: "c1",
        }),
      )
      .mockRejectedValueOnce(new Error("load-more fail"));

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("error-more");
    });

    expect(result.current.listings).toHaveLength(1);
  });

  it("ignores load-more when nextCursor is null", async () => {
    vi.mocked(getSavedListings).mockResolvedValueOnce(
      mockResponse({ listings: [listing("l1")], nextCursor: null }),
    );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    expect(getSavedListings).toHaveBeenCalledTimes(1);
  });
});
