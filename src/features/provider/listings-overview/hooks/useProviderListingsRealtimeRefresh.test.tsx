import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
} from "@/lib/realtime/attention";
import { getProviderListings } from "../api/provider-listings";
import { useProviderListingsRealtimeRefresh } from "./useProviderListingsRealtimeRefresh";

vi.mock("../api/provider-listings", () => ({
  getProviderListings: vi.fn(),
}));

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

describe("provider listings realtime refresh", () => {
  beforeEach(() => {
    vi.mocked(getProviderListings).mockReset();
    vi.mocked(getProviderListings).mockResolvedValue([]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("refreshes the mounted overview once per burst", async () => {
    const apply = vi.fn();
    renderHook(() => useProviderListingsRealtimeRefresh(true, apply));
    await act(async () => {
      scheduleConversationMessage("provider", "application-1");
      scheduleConversationMessage("provider", "application-2");
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getProviderListings).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenCalledWith([]);
  });

  it("does not refresh a static listings fixture", async () => {
    renderHook(() => useProviderListingsRealtimeRefresh(false, vi.fn()));
    await act(async () => {
      scheduleConversationMessage("provider", "application-1");
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getProviderListings).not.toHaveBeenCalled();
  });

  it("does not let the initial request overwrite a newer realtime response", async () => {
    let resolveOld!: (items: []) => void;
    vi.mocked(getProviderListings)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce([]);
    const apply = vi.fn();
    renderHook(() => useProviderListingsRealtimeRefresh(true, apply));
    await act(async () => {
      scheduleConversationMessage("provider", "application-1");
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(apply).toHaveBeenCalledTimes(1);
    await act(async () => resolveOld([]));
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it.each(["unmount", "disable"])(
    "ignores pending responses after %s",
    async (mode) => {
      let resolve!: (items: []) => void;
      vi.mocked(getProviderListings).mockReturnValueOnce(
        new Promise((done) => {
          resolve = done;
        }),
      );
      const apply = vi.fn();
      const view = renderHook(
        ({ enabled }) => useProviderListingsRealtimeRefresh(enabled, apply),
        { initialProps: { enabled: true } },
      );
      if (mode === "unmount") view.unmount();
      else view.rerender({ enabled: false });
      await act(async () => resolve([]));
      expect(apply).not.toHaveBeenCalled();
    },
  );

  it("keeps loaded data on refresh failure and clears the warning after retry", async () => {
    vi.mocked(getProviderListings)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([]);
    const apply = vi.fn();
    const { result } = renderHook(() =>
      useProviderListingsRealtimeRefresh(true, apply),
    );
    await act(async () => {});
    await act(async () => {
      scheduleConversationMessage("provider", "application-1");
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.refreshError).toContain("veraltet");
    expect(apply).toHaveBeenCalledTimes(1);
    await act(async () => result.current.retry());
    expect(result.current.refreshError).toBeNull();
    expect(apply).toHaveBeenCalledTimes(2);
  });
});
