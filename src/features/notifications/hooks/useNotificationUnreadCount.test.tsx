import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  subscribeConversationAttention,
  type AttentionNotice,
} from "@/lib/realtime/attention";
import { getNotificationUnreadCount } from "../api/notifications";
import type { NotificationUnread } from "../api/schema";
import { useNotificationUnreadCount } from "./useNotificationUnreadCount";

vi.mock("../api/notifications", () => ({
  getNotificationUnreadCount: vi.fn(),
}));
vi.mock("@/lib/realtime/attention", () => ({
  subscribeConversationAttention: vi.fn(),
}));

function unread(unreadCount: number): NotificationUnread {
  return {
    asOf: "2026-10-27T08:00:00.000Z",
    unreadCount,
    nextRevalidateAt: null,
  };
}

function pendingCount() {
  let resolve!: (value: NotificationUnread) => void;
  const promise = new Promise<NotificationUnread>((done) => {
    resolve = done;
  });
  return { promise, resolve: (count: number) => resolve(unread(count)) };
}

const notice: AttentionNotice = {
  refreshLists: false,
  refreshAllSummaries: false,
  summaryApplicationIds: [],
  viewingApplicationIds: [],
  listingIds: [],
  refreshNotifications: true,
};

describe("notification unread count refreshes", () => {
  let listener: ((notice: AttentionNotice) => void) | undefined;
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    listener = undefined;
    vi.mocked(subscribeConversationAttention).mockImplementation((callback) => {
      listener = callback;
      return unsubscribe;
    });
  });

  it("ignores an older mount response after a realtime refresh completes", async () => {
    const initial = pendingCount();
    const realtime = pendingCount();
    vi.mocked(getNotificationUnreadCount)
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(realtime.promise);
    const { result } = renderHook(() => useNotificationUnreadCount());
    act(() => listener?.(notice));
    await act(async () => {
      realtime.resolve(0);
    });
    expect(result.current.count).toBe(0);
    await act(async () => {
      initial.resolve(8);
    });
    expect(result.current.count).toBe(0);
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(2);
  });

  it("keeps the latest read acknowledgement count when manual refreshes finish out of order", async () => {
    const older = pendingCount();
    const latest = pendingCount();
    vi.mocked(getNotificationUnreadCount)
      .mockResolvedValueOnce(unread(5))
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(latest.promise);
    const { result } = renderHook(() => useNotificationUnreadCount());
    await waitFor(() => expect(result.current.count).toBe(5));
    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    act(() => {
      first = result.current.refresh();
      second = result.current.refresh();
    });
    await act(async () => {
      latest.resolve(0);
      await second;
    });
    await act(async () => {
      older.resolve(4);
      await first;
    });
    expect(result.current.count).toBe(0);
  });

  it("preserves the last count when the newest refresh fails", async () => {
    vi.mocked(getNotificationUnreadCount)
      .mockResolvedValueOnce(unread(3))
      .mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useNotificationUnreadCount());
    await waitFor(() => expect(result.current.count).toBe(3));
    expect(result.current.count).toBe(3);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.count).toBe(3);
  });

  it("does not refresh for an unrelated event", async () => {
    vi.mocked(getNotificationUnreadCount).mockResolvedValue(unread(2));
    const { result } = renderHook(() => useNotificationUnreadCount());
    await waitFor(() => expect(result.current.count).toBe(2));
    act(() => listener?.({ ...notice, refreshNotifications: false }));
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes and prevents refreshes after unmount", async () => {
    const initial = pendingCount();
    vi.mocked(getNotificationUnreadCount).mockReturnValue(initial.promise);
    const { result, unmount } = renderHook(() => useNotificationUnreadCount());
    const refresh = result.current.refresh;
    unmount();
    await act(async () => {
      initial.resolve(9);
      await refresh();
    });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("ignores the discarded effect request in Strict Mode", async () => {
    const discarded = pendingCount();
    const current = pendingCount();
    vi.mocked(getNotificationUnreadCount)
      .mockReturnValueOnce(discarded.promise)
      .mockReturnValueOnce(current.promise);
    const { result } = renderHook(() => useNotificationUnreadCount(), {
      reactStrictMode: true,
    });
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(2);
    await act(async () => {
      current.resolve(0);
    });
    await act(async () => {
      discarded.resolve(6);
    });
    expect(result.current.count).toBe(0);
  });
});
