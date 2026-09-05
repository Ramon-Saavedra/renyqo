import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicListings } from "../api/public-listings";
import type { PublicListingsResponse } from "../types";
import { EMPTY_FILTERS } from "../types";
import { usePublicListings } from "./usePublicListings";

vi.mock("../api/public-listings", () => ({
  getPublicListings: vi.fn(),
}));

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

describe("usePublicListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading-page state", () => {
    vi.mocked(getPublicListings).mockResolvedValue(mockResponse());

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    expect(result.current.fetchStatus).toBe("loading-page");
  });

  it("transitions to idle when the first page loads", async () => {
    vi.mocked(getPublicListings).mockResolvedValue(
      mockResponse({
        listings: [
          {
            id: "l1",
            title: "X",
            location: "",
            rooms: 1,
            livingArea: 1,
            availableFrom: null,
            coldRent: 1,
            serviceCharge: 0,
            matchesProfile: null,
            hasApplied: false,
            isNew: false,
            coverImageUrl: null,
            publishedAt: "",
          },
        ],
      }),
    );

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(result.current.listings).toHaveLength(1);
  });

  it("transitions to error-page on network failure", async () => {
    vi.mocked(getPublicListings).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("error-page");
    });

    expect(result.current.listings).toHaveLength(0);
  });

  it("loads more when loadMore is called and appends results", async () => {
    vi.mocked(getPublicListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "l1",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 3,
          nextCursor: "c1",
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "l2",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
            {
              id: "l3",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 3,
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.listings).toHaveLength(3);
    });

    expect(result.current.nextCursor).toBeNull();
    expect(result.current.total).toBe(3);
  });

  it("transitions to error-more when loadMore fails", async () => {
    vi.mocked(getPublicListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "l1",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 1,
          nextCursor: "c1",
        }),
      )
      .mockRejectedValueOnce(new Error("load-more fail"));

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

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
    vi.mocked(getPublicListings).mockResolvedValueOnce(
      mockResponse({
        listings: [
          {
            id: "l1",
            title: "",
            location: "",
            rooms: 0,
            livingArea: 0,
            availableFrom: null,
            coldRent: 0,
            serviceCharge: 0,
            matchesProfile: null,
            hasApplied: false,
            isNew: false,
            coverImageUrl: null,
            publishedAt: "",
          },
        ],
        nextCursor: null,
      }),
    );

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    expect(getPublicListings).toHaveBeenCalledTimes(1);
  });

  it("re-fetches when filters change", async () => {
    vi.mocked(getPublicListings).mockResolvedValue(mockResponse());

    const { result, rerender } = renderHook(
      ({ filters, sort, hasProfile }) =>
        usePublicListings(filters, sort, hasProfile),
      {
        initialProps: {
          filters: EMPTY_FILTERS as Parameters<typeof usePublicListings>[0],
          sort: "newest" as const,
          hasProfile: false,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(getPublicListings).toHaveBeenCalledTimes(1);

    rerender({
      filters: { ...EMPTY_FILTERS, maxColdRent: 900 },
      sort: "newest",
      hasProfile: false,
    });

    await waitFor(() => {
      expect(getPublicListings).toHaveBeenCalledTimes(2);
    });
  });

  it("re-fetches when sort changes", async () => {
    vi.mocked(getPublicListings).mockResolvedValue(mockResponse());

    const { result, rerender } = renderHook(
      ({ sort }: { sort: "newest" | "price-asc" }) =>
        usePublicListings(EMPTY_FILTERS, sort, false),
      {
        initialProps: { sort: "newest" as "newest" | "price-asc" },
      },
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    rerender({ sort: "price-asc" });

    await waitFor(() => {
      expect(getPublicListings).toHaveBeenCalledTimes(2);
    });
  });

  it("discards stale responses when filters change mid-flight", async () => {
    let resolveFirst: (value: PublicListingsResponse) => void = () => undefined;
    const firstPromise = new Promise<PublicListingsResponse>((res) => {
      resolveFirst = res;
    });

    vi.mocked(getPublicListings)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "after",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 1,
        }),
      );

    const { result, rerender } = renderHook(
      ({ filters }) => usePublicListings(filters, "newest", false),
      {
        initialProps: {
          filters: EMPTY_FILTERS as Parameters<typeof usePublicListings>[0],
        },
      },
    );

    rerender({
      filters: { ...EMPTY_FILTERS, maxColdRent: 700 },
    });

    await waitFor(() => {
      expect(getPublicListings).toHaveBeenCalledTimes(2);
    });

    resolveFirst(
      mockResponse({
        listings: [
          {
            id: "stale",
            title: "",
            location: "",
            rooms: 0,
            livingArea: 0,
            availableFrom: null,
            coldRent: 0,
            serviceCharge: 0,
            matchesProfile: null,
            hasApplied: false,
            isNew: false,
            coverImageUrl: null,
            publishedAt: "",
          },
        ],
        total: 99,
      }),
    );

    await waitFor(() => {
      expect(result.current.listings?.[0]?.id).toBe("after");
    });

    expect(result.current.total).toBe(1);
  });

  it("re-fetches when retry is called after error-page", async () => {
    vi.mocked(getPublicListings)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "retried",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
        }),
      );

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("error-page");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(result.current.listings).toHaveLength(1);
  });

  it("passes onlyMatching only when hasProfile is true", async () => {
    vi.mocked(getPublicListings).mockResolvedValue(mockResponse());

    renderHook(() =>
      usePublicListings(
        { ...EMPTY_FILTERS, onlyMatching: true },
        "newest",
        false,
      ),
    );

    await waitFor(() => {
      expect(getPublicListings).toHaveBeenCalled();
    });

    const params1 = vi.mocked(getPublicListings).mock.calls[0]?.[0];
    expect(params1?.onlyMatching).toBeUndefined();

    vi.clearAllMocks();
    vi.mocked(getPublicListings).mockResolvedValue(mockResponse());

    renderHook(() =>
      usePublicListings(
        { ...EMPTY_FILTERS, onlyMatching: true },
        "newest",
        true,
      ),
    );

    await waitFor(() => {
      expect(getPublicListings).toHaveBeenCalled();
    });

    const params2 = vi.mocked(getPublicListings).mock.calls[0]?.[0];
    expect(params2?.onlyMatching).toBe(true);
  });

  it("retryMore re-triggers the load-more fetch after error-more", async () => {
    vi.mocked(getPublicListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "l1",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 3,
          nextCursor: "c1",
        }),
      )
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(
        mockResponse({
          listings: [
            {
              id: "l2",
              title: "",
              location: "",
              rooms: 0,
              livingArea: 0,
              availableFrom: null,
              coldRent: 0,
              serviceCharge: 0,
              matchesProfile: null,
              hasApplied: false,
              isNew: false,
              coverImageUrl: null,
              publishedAt: "",
            },
          ],
          total: 3,
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() =>
      usePublicListings(EMPTY_FILTERS, "newest", false),
    );

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    // Trigger load-more which fails.
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("error-more");
    });

    // retryMore should re-trigger only load-more, not page 1.
    act(() => {
      result.current.retryMore();
    });

    await waitFor(() => {
      expect(result.current.listings).toHaveLength(2);
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
