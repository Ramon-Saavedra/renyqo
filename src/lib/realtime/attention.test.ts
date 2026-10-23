import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import {
  registerOpenConversation,
  openConversationCount,
} from "./open-conversations";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
  scheduleConversationSummary,
  scheduleRealtimeResync,
  subscribeConversationAttention,
} from "./attention";

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

describe("realtime attention", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("normalizes backend role casing into the applicant attention store", () => {
    scheduleConversationMessage("APPLICANT", "application-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    expect(invalidateGlobalAttention).toHaveBeenCalledOnce();
    expect(invalidateGlobalAttention).toHaveBeenCalledWith("applicant");
  });

  it("coalesces a burst into one attention refresh and one catch-up", () => {
    const notice = vi.fn();
    const catchUp = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    const unregister = registerOpenConversation("application-1", catchUp);

    scheduleConversationMessage("applicant", "application-1");
    scheduleConversationMessage("applicant", "application-1");
    scheduleConversationMessage("applicant", "application-2");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);

    expect(invalidateGlobalAttention).toHaveBeenCalledTimes(1);
    expect(invalidateGlobalAttention).toHaveBeenCalledWith("applicant");
    expect(notice).toHaveBeenCalledTimes(1);
    expect(notice).toHaveBeenCalledWith({
      refreshLists: true,
      refreshAllSummaries: false,
      summaryApplicationIds: [],
    });
    expect(catchUp).toHaveBeenCalledTimes(1);
    expect(openConversationCount()).toBe(1);

    unsubscribe();
    unregister();
  });

  it("lets a summary replace catch-up for the same application", () => {
    const notice = vi.fn();
    const catchUp = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    const unregister = registerOpenConversation("application-1", catchUp);

    scheduleConversationMessage("provider", "application-1");
    scheduleConversationSummary("provider", "application-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);

    expect(catchUp).not.toHaveBeenCalled();
    expect(notice).toHaveBeenCalledWith({
      refreshLists: true,
      refreshAllSummaries: false,
      summaryApplicationIds: ["application-1"],
    });

    unsubscribe();
    unregister();
  });

  it("resyncs every mounted summary and open conversation once", () => {
    const notice = vi.fn();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    const unregisterFirst = registerOpenConversation("application-1", first);
    const unregisterSecond = registerOpenConversation("application-2", second);

    scheduleRealtimeResync("applicant");
    scheduleConversationMessage("applicant", "application-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);

    expect(invalidateGlobalAttention).toHaveBeenCalledTimes(1);
    expect(notice).toHaveBeenCalledWith({
      refreshLists: true,
      refreshAllSummaries: true,
      summaryApplicationIds: [],
    });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();

    unsubscribe();
    unregisterFirst();
    unregisterSecond();
  });

  it("continues refreshing other listeners when one throws", () => {
    const unsubscribe = subscribeConversationAttention(() => {
      throw new Error("surface failed");
    });
    const catchUp = vi.fn();
    const unregister = registerOpenConversation("application-1", catchUp);
    scheduleConversationMessage("applicant", "application-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    expect(catchUp).toHaveBeenCalledOnce();
    unsubscribe();
    unregister();
  });
});
