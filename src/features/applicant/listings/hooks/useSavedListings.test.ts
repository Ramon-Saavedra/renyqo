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

  it("aborts the initial request on unmount", async () => {
    vi.mocked(getSavedListings).mockReturnValue(
      new Promise<PublicListingsResponse>(() => undefined),
    );

    const { unmount } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(getSavedListings).toHaveBeenCalledTimes(1);
    });

    const signal = vi.mocked(getSavedListings).mock.calls[0]?.[1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("aborts an in-flight load-more request on unmount and ignores its response", async () => {
    let resolveMore: (value: PublicListingsResponse) => void = () => undefined;
    const morePromise = new Promise<PublicListingsResponse>((resolve) => {
      resolveMore = resolve;
    });

    vi.mocked(getSavedListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l1")],
          total: 2,
          nextCursor: "c1",
        }),
      )
      .mockReturnValueOnce(morePromise);

    const { result, unmount } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(getSavedListings).toHaveBeenCalledTimes(2);
    });

    const loadMoreSignal =
      vi.mocked(getSavedListings).mock.calls[1]?.[1]?.signal;
    unmount();
    expect(loadMoreSignal?.aborted).toBe(true);

    await act(async () => {
      resolveMore(
        mockResponse({
          listings: [listing("l2")],
          total: 2,
          nextCursor: null,
        }),
      );
      await morePromise;
    });
  });

  it("aborts the previous load-more request and ignores its stale response", async () => {
    let resolveFirstMore: (value: PublicListingsResponse) => void = () =>
      undefined;
    let resolveSecondMore: (value: PublicListingsResponse) => void = () =>
      undefined;
    const firstMore = new Promise<PublicListingsResponse>((resolve) => {
      resolveFirstMore = resolve;
    });
    const secondMore = new Promise<PublicListingsResponse>((resolve) => {
      resolveSecondMore = resolve;
    });

    vi.mocked(getSavedListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l1")],
          total: 3,
          nextCursor: "c1",
        }),
      )
      .mockReturnValueOnce(firstMore)
      .mockReturnValueOnce(secondMore);

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(getSavedListings).toHaveBeenCalledTimes(2);
    });

    const firstSignal = vi.mocked(getSavedListings).mock.calls[1]?.[1]?.signal;

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(getSavedListings).toHaveBeenCalledTimes(3);
    });

    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      resolveFirstMore(
        mockResponse({
          listings: [listing("stale")],
          total: 3,
          nextCursor: "c2",
        }),
      );
      await firstMore;
    });

    expect(result.current.listings.map((item) => item.id)).toEqual(["l1"]);

    await act(async () => {
      resolveSecondMore(
        mockResponse({
          listings: [listing("l2")],
          total: 3,
          nextCursor: null,
        }),
      );
      await secondMore;
    });

    await waitFor(() => {
      expect(result.current.listings.map((item) => item.id)).toEqual([
        "l1",
        "l2",
      ]);
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.nextCursor).toBeNull();
  });

  it("removes a listing and decrements the total", async () => {
    vi.mocked(getSavedListings).mockResolvedValue(
      mockResponse({
        listings: [listing("l1"), listing("l2")],
        total: 2,
      }),
    );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.removeListing("l1");
    });

    expect(result.current.listings.map((item) => item.id)).toEqual(["l2"]);
    expect(result.current.total).toBe(1);
  });

  it("does not decrement the total when the listing is not in the current page", async () => {
    vi.mocked(getSavedListings).mockResolvedValue(
      mockResponse({
        listings: [listing("l1")],
        total: 1,
      }),
    );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.removeListing("missing");
    });

    expect(result.current.listings.map((item) => item.id)).toEqual(["l1"]);
    expect(result.current.total).toBe(1);
  });

  it("loads the next page when the last visible saved listing is removed", async () => {
    vi.mocked(getSavedListings)
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l1")],
          total: 2,
          nextCursor: "c1",
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          listings: [listing("l2")],
          total: 1,
          nextCursor: null,
        }),
      );

    const { result } = renderHook(() => useSavedListings());

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    act(() => {
      result.current.removeListing("l1");
    });

    await waitFor(() => {
      expect(result.current.listings.map((item) => item.id)).toEqual(["l2"]);
    });

    expect(getSavedListings).toHaveBeenLastCalledWith(
      { limit: 20, cursor: "c1" },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.total).toBe(1);
    expect(result.current.nextCursor).toBeNull();
    expect(result.current.fetchStatus).toBe("idle");
  });
});
