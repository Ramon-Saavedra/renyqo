import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, StrictMode, type ReactNode } from "react";

import type { DashboardObjectStatus } from "../types";
import { TabRefreshProvider } from "./TabRefreshProvider";
import { useListingData } from "./useListingData";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(TabRefreshProvider, null, children);
}

function strictWrapper({ children }: { children: ReactNode }) {
  return createElement(
    StrictMode,
    null,
    createElement(TabRefreshProvider, null, children),
  );
}

interface SampleData {
  readonly items: readonly string[];
}

function fireFocus() {
  window.dispatchEvent(new Event("focus"));
}

describe("useListingData", () => {
  const idleData: SampleData = { items: [] };
  const loadingData: SampleData = { items: ["loading"] };

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

  it("returns idle data when no listing is selected", () => {
    const load = vi.fn();
    const { result } = renderHook(
      () => useListingData(null, null, idleData, loadingData, load),
      { wrapper },
    );

    expect(result.current).toEqual({
      data: idleData,
      isLoading: false,
      hasError: false,
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("does not load for a draft listing", () => {
    const load = vi.fn();
    const { result } = renderHook(
      () => useListingData("listing-1", "draft", idleData, loadingData, load),
      { wrapper },
    );

    expect(result.current).toEqual({
      data: idleData,
      isLoading: false,
      hasError: false,
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("loads data on mount for a published listing", async () => {
    const load = vi.fn().mockResolvedValue({
      data: { items: ["a"] },
      hasError: false,
    });

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(load).toHaveBeenCalledWith("listing-1");
    expect(result.current.data).toEqual({ items: ["a"] });
    expect(result.current.hasError).toBe(false);
  });

  it("completes the initial load in Strict Mode", async () => {
    const load = vi.fn().mockResolvedValue({
      data: { items: ["a"] },
      hasError: false,
    });

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper: strictWrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it("reports error when initial load fails", async () => {
    const load = vi.fn().mockRejectedValue(new Error("network"));

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.data).toEqual(idleData);
    expect(result.current.isLoading).toBe(false);
  });

  it("preserves data on a failed silent refresh", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: ["a"] }, hasError: false })
      .mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.data).toEqual({ items: ["a"] });
    expect(result.current.isLoading).toBe(false);
  });

  it("preserves data when a silent refresh resolves with an error", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: ["a"] }, hasError: false })
      .mockResolvedValueOnce({ data: idleData, hasError: true });

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.data).toEqual({ items: ["a"] });
    expect(result.current.isLoading).toBe(false);
  });

  it("refreshes data on window focus without a loading state", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: ["a"] }, hasError: false })
      .mockResolvedValueOnce({ data: { items: ["b"] }, hasError: false });

    const { result } = renderHook(
      () =>
        useListingData("listing-1", "published", idleData, loadingData, load),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["b"] });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("ignores stale responses after the listing changes", async () => {
    let resolveFirst:
      | ((value: { data: SampleData; hasError: boolean }) => void)
      | undefined;
    const firstRequest = new Promise<{ data: SampleData; hasError: boolean }>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );

    const load = vi
      .fn()
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce({
        data: { items: ["b"] },
        hasError: false,
      });

    const { result, rerender } = renderHook(
      ({ listingId }: { listingId: string }) =>
        useListingData(listingId, "published", idleData, loadingData, load),
      { wrapper, initialProps: { listingId: "listing-1" } },
    );

    rerender({ listingId: "listing-2" });

    await waitFor(() => {
      expect(result.current.data.items).toContain("b");
    });

    resolveFirst?.({ data: { items: ["stale"] }, hasError: false });
    await waitFor(() => {
      expect(result.current.data.items).toContain("b");
    });
    expect(result.current.data.items).not.toContain("stale");
  });

  it("reloads with a loading state when returning to a published listing from draft", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: ["a"] }, hasError: false })
      .mockResolvedValueOnce({ data: { items: ["b"] }, hasError: false });

    const { result, rerender } = renderHook(
      ({
        listingId,
        listingStatus,
      }: {
        listingId: string;
        listingStatus: DashboardObjectStatus;
      }) =>
        useListingData(listingId, listingStatus, idleData, loadingData, load),
      {
        wrapper,
        initialProps: { listingId: "listing-1", listingStatus: "published" },
      },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    rerender({ listingId: "listing-1", listingStatus: "draft" });
    expect(result.current).toEqual({
      data: idleData,
      isLoading: false,
      hasError: false,
    });

    rerender({ listingId: "listing-1", listingStatus: "published" });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual(loadingData);

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["b"] });
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("loads a changed listing once after a focus refresh", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: ["a"] }, hasError: false })
      .mockResolvedValueOnce({ data: { items: ["b"] }, hasError: false })
      .mockResolvedValue({ data: { items: ["c"] }, hasError: false });

    const { result, rerender } = renderHook(
      ({ listingId }: { listingId: string }) =>
        useListingData(listingId, "published", idleData, loadingData, load),
      { wrapper, initialProps: { listingId: "listing-1" } },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["a"] });
    });

    fireFocus();

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["b"] });
    });

    rerender({ listingId: "listing-2" });

    await waitFor(() => {
      expect(result.current.data).toEqual({ items: ["c"] });
    });

    expect(load).toHaveBeenCalledTimes(3);
    expect(load).toHaveBeenNthCalledWith(3, "listing-2");
  });
});
