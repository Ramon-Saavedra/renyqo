import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

import {
  getProviderActiveApplications,
  getProviderWaitingCount,
} from "../api/provider-listing-applications";
import { useSelectedListingApplications } from "./useSelectedListingApplications";
import { TabRefreshProvider } from "./TabRefreshProvider";
import type { DashboardObjectStatus } from "../types";

vi.mock("../api/provider-listing-applications", () => ({
  getProviderActiveApplications: vi.fn(),
  getProviderWaitingCount: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(TabRefreshProvider, null, children);
}

const baseApplicant = {
  name: "Anna Lehmann",
  peopleCount: 2,
  warnings: [],
};

describe("useSelectedListingApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  function fireFocus() {
    window.dispatchEvent(new Event("focus"));
  }

  function fireVisible() {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  it("does not fetch when no listing is selected", async () => {
    const { result } = renderHook(
      () => useSelectedListingApplications(null, null),
      { wrapper },
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
        activeAt: null,
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(2);

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
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

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
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
        activeAt: null,
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockRejectedValue(new Error("network"));

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
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
        activeAt: null,
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
        wrapper,
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
        activeAt: null,
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
          activeAt: null,
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
      { wrapper, initialProps: { listingId: "listing-1" } },
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

  it("refetches on window focus keeping existing data visible", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(2);

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Anna Lehmann");
    });

    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-2",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: { ...baseApplicant, name: "Ben Becker" },
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    fireFocus();

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Ben Becker");
    });
    expect(result.current.waitingCountState).toEqual({
      status: "success",
      count: 0,
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("reports refresh failure with empty candidates", async () => {
    vi.mocked(getProviderActiveApplications)
      .mockResolvedValueOnce([
        {
          id: "application-1",
          listingId: "listing-1",
          status: "ACTIVE",
          activeAt: null,
          applicant: baseApplicant,
        },
      ])
      .mockRejectedValueOnce(new Error("network"));
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.candidates).toHaveLength(1);
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("refetches when the document becomes visible", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(2);

    const { result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Anna Lehmann");
    });

    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-2",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: { ...baseApplicant, name: "Ben Becker" },
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(0);

    fireVisible();

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Ben Becker");
    });
  });

  it("does not refetch on focus when no listing is selected", () => {
    const { result } = renderHook(
      () => useSelectedListingApplications(null, null),
      { wrapper },
    );

    fireFocus();

    expect(result.current).toEqual({
      candidates: [],
      waitingCountState: { status: "idle" },
      isLoading: false,
      hasError: false,
    });
    expect(getProviderActiveApplications).not.toHaveBeenCalled();
    expect(getProviderWaitingCount).not.toHaveBeenCalled();
  });

  it("does not dispatch refreshes after unmount", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: baseApplicant,
      },
    ]);
    vi.mocked(getProviderWaitingCount).mockResolvedValue(2);

    const { unmount, result } = renderHook(
      () => useSelectedListingApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.candidates[0]?.name).toBe("Anna Lehmann");
    });

    vi.mocked(getProviderActiveApplications).mockClear();
    vi.mocked(getProviderWaitingCount).mockClear();
    unmount();

    fireFocus();
    fireVisible();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getProviderActiveApplications).not.toHaveBeenCalled();
    expect(getProviderWaitingCount).not.toHaveBeenCalled();
  });
});
