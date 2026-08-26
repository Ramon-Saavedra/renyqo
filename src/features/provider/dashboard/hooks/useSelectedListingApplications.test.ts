import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProviderActiveApplications,
  getProviderWaitingCount,
} from "../api/provider-listing-applications";
import { useSelectedListingApplications } from "./useSelectedListingApplications";
import type { DashboardObjectStatus } from "../types";

vi.mock("../api/provider-listing-applications", () => ({
  getProviderActiveApplications: vi.fn(),
  getProviderWaitingCount: vi.fn(),
}));

const baseApplicant = {
  name: "Anna Lehmann",
  peopleCount: 2,
};

describe("useSelectedListingApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when no listing is selected", async () => {
    const { result } = renderHook(() =>
      useSelectedListingApplications(null, null),
    );

    expect(result.current).toEqual({
      candidates: [],
      waitingCountState: { status: "idle" },
      isLoading: false,
      hasError: false,
    });
    expect(getProviderActiveApplications).not.toHaveBeenCalled();
    expect(getProviderWaitingCount).not.toHaveBeenCalled();
  });

  it("loads active applications and waiting count for a published listing", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(2);

    const { result } = renderHook(() =>
      useSelectedListingApplications("listing-1", "published"),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.candidates[0]?.name).toBe("Anna Lehmann");
    expect(result.current.waitingCountState).toEqual({
      status: "success",
      count: 2,
    });
    expect(result.current.hasError).toBe(false);
  });

  it("sets error state when application loading fails", async () => {
    vi.mocked(getProviderActiveApplications).mockRejectedValue(
      new Error("network"),
    );
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    const { result } = renderHook(() =>
      useSelectedListingApplications("listing-1", "published"),
    );

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.waitingCountState).toEqual({
      status: "success",
      count: 0,
    });
  });

  it("keeps active applications when only waiting-count loading fails", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useSelectedListingApplications("listing-1", "published"),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.waitingCountState).toEqual({ status: "error" });
    expect(result.current.hasError).toBe(false);
  });

  it("does not show stale data when returning to a published listing from draft", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(1);

    const { result, rerender } = renderHook<
      ReturnType<typeof useSelectedListingApplications>,
      { listingId: string; listingStatus: DashboardObjectStatus }
    >(
      ({ listingId, listingStatus }) =>
        useSelectedListingApplications(listingId, listingStatus),
      {
        initialProps: {
          listingId: "listing-1",
          listingStatus: "published",
        },
      },
    );

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Anna Lehmann");
    });

    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-2",
        listingId: "listing-1",
        status: "ACTIVE",
        applicant: {
          ...baseApplicant,
          name: "Ben Becker",
        },
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    rerender({ listingId: "listing-1", listingStatus: "draft" });
    expect(result.current).toEqual({
      candidates: [],
      waitingCountState: { status: "idle" },
      isLoading: false,
      hasError: false,
    });

    rerender({ listingId: "listing-1", listingStatus: "published" });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.candidates).toEqual([]);

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Ben Becker");
    });
    expect(result.current.waitingCountState).toEqual({
      status: "success",
      count: 0,
    });
  });

  it("ignores stale responses after the selected listing changes", async () => {
    let resolveFirst: ((value: readonly never[]) => void) | undefined;
    const firstRequest = new Promise<readonly never[]>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(getProviderActiveApplications)
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce([
        {
          id: "application-2",
          listingId: "listing-2",
          status: "ACTIVE",
          applicant: {
            ...baseApplicant,
            name: "Ben Becker",
            peopleCount: 1,
          },
        },
      ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    const { result, rerender } = renderHook(
      ({ listingId }) => useSelectedListingApplications(listingId, "published"),
      { initialProps: { listingId: "listing-1" } },
    );

    rerender({ listingId: "listing-2" });

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Ben Becker");
    });

    resolveFirst?.([]);
    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Ben Becker");
    });
  });
});
