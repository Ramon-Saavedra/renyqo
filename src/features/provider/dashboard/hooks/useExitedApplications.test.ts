import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

import { getProviderExitedApplications } from "../api/provider-exited-applications";
import type { ProviderExitedApplicationsResponse } from "../api/provider-exited-applications";
import { restoreProviderApplication } from "../api/provider-application-restore";
import { useExitedApplications } from "./useExitedApplications";
import { TabRefreshProvider } from "./TabRefreshProvider";
import type { DashboardObjectStatus } from "../types";

vi.mock("../api/provider-exited-applications", () => ({
  getProviderExitedApplications: vi.fn(),
}));

vi.mock("../api/provider-application-restore", () => ({
  restoreProviderApplication: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(TabRefreshProvider, null, children);
}

const withdrawn = {
  id: "exit-1",
  listingId: "listing-1",
  applicantName: "Familie Weber",
  status: "WITHDRAWN" as const,
  publicReason: null,
  exitedAt: "2026-08-30T14:23:00.000Z",
};

describe("useExitedApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(restoreProviderApplication).mockResolvedValue();
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

  it("does not fetch when no listing is selected", () => {
    const { result } = renderHook(() => useExitedApplications(null, null), {
      wrapper,
    });

    expect(result.current).toMatchObject({
      exits: [],
      totalCount: 0,
      isLoading: false,
      hasError: false,
      restorationState: { status: "idle" },
    });
    expect(getProviderExitedApplications).not.toHaveBeenCalled();
  });

  it("does not fetch for a draft listing", () => {
    const { result } = renderHook(
      () => useExitedApplications("listing-1", "draft"),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(false);
    expect(getProviderExitedApplications).not.toHaveBeenCalled();
  });

  it("loads and maps exited applications for a published listing", async () => {
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [withdrawn],
      totalCount: 1,
    });

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.exits).toHaveLength(1);
    expect(result.current.exits[0]?.applicantName).toBe("Familie Weber");
    expect(result.current.exits[0]?.visualState).toBe("withdrawn");
    expect(result.current.totalCount).toBe(1);
    expect(result.current.hasError).toBe(false);
  });

  it("sets error state when loading fails", async () => {
    vi.mocked(getProviderExitedApplications).mockRejectedValue(
      new Error("network"),
    );

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.exits).toEqual([]);
  });

  it("does not show stale data when returning to a published listing from draft", async () => {
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [withdrawn],
      totalCount: 1,
    });

    const { result, rerender } = renderHook<
      ReturnType<typeof useExitedApplications>,
      { listingId: string; listingStatus: DashboardObjectStatus }
    >(
      ({ listingId, listingStatus }) =>
        useExitedApplications(listingId, listingStatus),
      {
        wrapper,
        initialProps: { listingId: "listing-1", listingStatus: "published" },
      },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    rerender({ listingId: "listing-1", listingStatus: "draft" });
    expect(result.current).toMatchObject({
      exits: [],
      totalCount: 0,
      isLoading: false,
      hasError: false,
      restorationState: { status: "idle" },
    });
  });

  it("ignores stale responses after the selected listing changes", async () => {
    let resolveFirst:
      | ((value: ProviderExitedApplicationsResponse) => void)
      | undefined;
    const firstRequest = new Promise<ProviderExitedApplicationsResponse>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );

    vi.mocked(getProviderExitedApplications)
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce({
        items: [{ ...withdrawn, id: "exit-2", listingId: "listing-2" }],
        totalCount: 1,
      });

    const { result, rerender } = renderHook(
      ({ listingId }) => useExitedApplications(listingId, "published"),
      { wrapper, initialProps: { listingId: "listing-1" } },
    );

    rerender({ listingId: "listing-2" });

    await waitFor(() => {
      expect(result.current.exits[0]?.id).toBe("exit-2");
    });
    expect(result.current.totalCount).toBe(1);

    await act(async () => {
      resolveFirst?.({ items: [], totalCount: 0 });
      await firstRequest;
    });

    expect(result.current.exits[0]?.id).toBe("exit-2");
    expect(result.current.totalCount).toBe(1);
  });

  it("refetches exits on window focus keeping existing data visible", async () => {
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [withdrawn],
      totalCount: 1,
    });

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [{ ...withdrawn, id: "exit-2" }],
      totalCount: 2,
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.exits[0]?.id).toBe("exit-2");
    });
    expect(result.current.totalCount).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("refetches exits when the document becomes visible", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [withdrawn],
      totalCount: 1,
    });

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [{ ...withdrawn, id: "exit-2" }],
      totalCount: 2,
    });

    fireVisible();

    await waitFor(() => {
      expect(result.current.exits[0]?.id).toBe("exit-2");
    });
    expect(result.current.totalCount).toBe(2);
  });

  it("preserves exits when a silent refresh fails", async () => {
    vi.mocked(getProviderExitedApplications)
      .mockResolvedValueOnce({ items: [withdrawn], totalCount: 1 })
      .mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.exits[0]?.id).toBe("exit-1");
    expect(result.current.totalCount).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("keeps a confirmed restoration consistent when the authoritative refresh fails", async () => {
    vi.mocked(getProviderExitedApplications)
      .mockResolvedValueOnce({
        items: [withdrawn, { ...withdrawn, id: "exit-2" }],
        totalCount: 2,
      })
      .mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(2);
    });

    await act(async () => {
      expect(await result.current.restoreCandidate("exit-1")).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(restoreProviderApplication).toHaveBeenCalledWith("exit-1");
    expect(result.current.exits.map((exit) => exit.id)).toEqual(["exit-2"]);
    expect(result.current.totalCount).toBe(1);
  });

  it("ignores an older refresh after restoration when the authoritative refresh fails", async () => {
    let resolveOlderRefresh:
      | ((value: ProviderExitedApplicationsResponse) => void)
      | undefined;
    let rejectAuthoritativeRefresh: ((reason: Error) => void) | undefined;
    const olderRefresh = new Promise<ProviderExitedApplicationsResponse>(
      (resolve) => {
        resolveOlderRefresh = resolve;
      },
    );
    const authoritativeRefresh =
      new Promise<ProviderExitedApplicationsResponse>((_, reject) => {
        rejectAuthoritativeRefresh = reject;
      });
    vi.mocked(getProviderExitedApplications)
      .mockResolvedValueOnce({
        items: [withdrawn, { ...withdrawn, id: "exit-2" }],
        totalCount: 2,
      })
      .mockReturnValueOnce(olderRefresh)
      .mockReturnValueOnce(authoritativeRefresh);

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(2);
    });

    fireFocus();
    await waitFor(() => {
      expect(getProviderExitedApplications).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      expect(await result.current.restoreCandidate("exit-1")).toBe(true);
    });
    await waitFor(() => {
      expect(getProviderExitedApplications).toHaveBeenCalledTimes(3);
    });

    await act(async () => {
      resolveOlderRefresh?.({
        items: [withdrawn, { ...withdrawn, id: "exit-2" }],
        totalCount: 2,
      });
      await olderRefresh;
    });

    expect(result.current.exits.map((exit) => exit.id)).toEqual(["exit-2"]);
    expect(result.current.totalCount).toBe(1);

    await act(async () => {
      rejectAuthoritativeRefresh?.(new Error("network"));
      await authoritativeRefresh.catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
    expect(result.current.exits.map((exit) => exit.id)).toEqual(["exit-2"]);
    expect(result.current.totalCount).toBe(1);
  });

  it("never decrements the confirmed exited count below zero", async () => {
    vi.mocked(getProviderExitedApplications)
      .mockResolvedValueOnce({ items: [withdrawn], totalCount: 0 })
      .mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    await act(async () => {
      expect(await result.current.restoreCandidate("exit-1")).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.exits).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("shows a loading state when returning to a published listing from draft", async () => {
    vi.mocked(getProviderExitedApplications)
      .mockResolvedValueOnce({ items: [withdrawn], totalCount: 1 })
      .mockResolvedValueOnce({
        items: [{ ...withdrawn, id: "exit-2" }],
        totalCount: 2,
      });

    const { result, rerender } = renderHook<
      ReturnType<typeof useExitedApplications>,
      { listingId: string; listingStatus: DashboardObjectStatus }
    >(
      ({ listingId, listingStatus }) =>
        useExitedApplications(listingId, listingStatus),
      {
        wrapper,
        initialProps: { listingId: "listing-1", listingStatus: "published" },
      },
    );

    await waitFor(() => {
      expect(result.current.exits[0]?.id).toBe("exit-1");
    });

    rerender({ listingId: "listing-1", listingStatus: "draft" });
    expect(result.current).toMatchObject({
      exits: [],
      totalCount: 0,
      isLoading: false,
      hasError: false,
      restorationState: { status: "idle" },
    });

    rerender({ listingId: "listing-1", listingStatus: "published" });
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.exits[0]?.id).toBe("exit-2");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("does not refetch on focus when no listing is selected", () => {
    const { result } = renderHook(() => useExitedApplications(null, null), {
      wrapper,
    });

    fireFocus();

    expect(result.current).toMatchObject({
      exits: [],
      totalCount: 0,
      isLoading: false,
      hasError: false,
      restorationState: { status: "idle" },
    });
    expect(getProviderExitedApplications).not.toHaveBeenCalled();
  });

  it("does not dispatch refreshes after unmount", async () => {
    vi.mocked(getProviderExitedApplications).mockResolvedValue({
      items: [withdrawn],
      totalCount: 1,
    });

    const { unmount, result } = renderHook(
      () => useExitedApplications("listing-1", "published"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.exits).toHaveLength(1);
    });

    vi.mocked(getProviderExitedApplications).mockClear();
    unmount();

    fireFocus();
    fireVisible();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getProviderExitedApplications).not.toHaveBeenCalled();
  });
});
