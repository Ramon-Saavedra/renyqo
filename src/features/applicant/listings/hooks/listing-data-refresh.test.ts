import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublicListings,
  getPublicListingDetail,
} from "../api/public-listings";
import { getSavedListings } from "../api/saved-listings";
import { getApplicantApplicationsOverview } from "../../applications/api/overview";
import { useApplicationsOverview } from "../../applications/hooks/useApplicationsOverview";
import { usePublicListings } from "./usePublicListings";
import { usePublicListingDetail } from "./usePublicListingDetail";
import { useSavedListings } from "./useSavedListings";
import { EMPTY_FILTERS } from "../types";
import { invalidateListingApplicationData } from "../utils/listing-data-invalidation";

vi.mock("../api/public-listings", () => ({
  getPublicListings: vi.fn(),
  getPublicListingDetail: vi.fn(),
}));
vi.mock("../api/saved-listings", () => ({ getSavedListings: vi.fn() }));
vi.mock("../../applications/api/overview", () => ({
  getApplicantApplicationsOverview: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPublicListings).mockResolvedValue({
    listings: [],
    total: 0,
    nextCursor: null,
  });
  vi.mocked(getPublicListingDetail).mockResolvedValue(null);
  vi.mocked(getSavedListings).mockResolvedValue({
    listings: [],
    total: 0,
    nextCursor: null,
  });
  vi.mocked(getApplicantApplicationsOverview).mockResolvedValue({
    asOf: "2026-10-10T00:00:00Z",
    items: [],
    totalCount: 0,
    pagination: { limit: 20, hasMore: false, nextCursor: null },
    counts: { all: 0, active: 0, waiting: 0, done: 0 },
  });
});

describe("listing application invalidation", () => {
  it("refreshes mounted public, detail, saved and application reads", async () => {
    renderHook(() => usePublicListings(EMPTY_FILTERS, "newest", true));
    renderHook(() => usePublicListingDetail("listing"));
    renderHook(() => useSavedListings());
    renderHook(() => useApplicationsOverview("ALL"));
    const reads = [
      getPublicListings,
      getPublicListingDetail,
      getSavedListings,
      getApplicantApplicationsOverview,
    ];
    await waitFor(() =>
      reads.forEach((read) => expect(read).toHaveBeenCalledTimes(1)),
    );
    act(() => invalidateListingApplicationData());
    await waitFor(() =>
      reads.forEach((read) => expect(read).toHaveBeenCalledTimes(2)),
    );
  });
});
