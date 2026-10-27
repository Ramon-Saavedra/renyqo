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
  scheduleLifecycleChanged,
  scheduleListingApplicationsChanged,
  scheduleNotificationsChanged,
  scheduleRealtimeResync,
  scheduleViewingChanged,
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
      viewingApplicationIds: [],
      listingIds: [],
      refreshNotifications: false,
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
      viewingApplicationIds: [],
      listingIds: [],
      refreshNotifications: false,
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
      viewingApplicationIds: [],
      listingIds: [],
      refreshNotifications: true,
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

  it("coalesces a viewing burst into one list, snapshot, and notification refresh", () => {
    const notice = vi.fn();
    const catchUp = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    const unregister = registerOpenConversation("application-1", catchUp);

    scheduleViewingChanged("provider", "application-1", "listing-1");
    scheduleViewingChanged("provider", "application-1", "listing-1");
    scheduleLifecycleChanged("provider", "application-1", "listing-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);

    expect(invalidateGlobalAttention).toHaveBeenCalledTimes(1);
    expect(notice).toHaveBeenCalledTimes(1);
    expect(catchUp).toHaveBeenCalledOnce();
    expect(notice).toHaveBeenCalledWith({
      refreshLists: true,
      refreshAllSummaries: false,
      summaryApplicationIds: ["application-1"],
      viewingApplicationIds: ["application-1"],
      listingIds: ["listing-1"],
      refreshNotifications: true,
    });
    unsubscribe();
    unregister();
  });

  it("refreshes listing cards without inventing an application id", () => {
    const notice = vi.fn();
    const catchUp = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    const unregister = registerOpenConversation("application-1", catchUp);

    scheduleListingApplicationsChanged("provider", "listing-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);

    expect(notice).toHaveBeenCalledWith({
      refreshLists: true,
      refreshAllSummaries: false,
      summaryApplicationIds: [],
      viewingApplicationIds: [],
      listingIds: ["listing-1"],
      refreshNotifications: true,
    });
    expect(catchUp).not.toHaveBeenCalled();
    unsubscribe();
    unregister();
  });

  it("refreshes only notifications for a notification hint", () => {
    const notice = vi.fn();
    const unsubscribe = subscribeConversationAttention(notice);
    scheduleNotificationsChanged("applicant");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    expect(invalidateGlobalAttention).not.toHaveBeenCalled();
    expect(notice).toHaveBeenCalledWith({
      refreshLists: false,
      refreshAllSummaries: false,
      summaryApplicationIds: [],
      viewingApplicationIds: [],
      listingIds: [],
      refreshNotifications: true,
    });
    unsubscribe();
  });

  it("leaves the current deep link in place while a hint flushes", () => {
    window.history.replaceState(
      null,
      "",
      "/provider/applications/application-1?listingId=listing-1&section=viewing&proposalId=proposal-1",
    );
    scheduleViewingChanged("provider", "application-1", "listing-1");
    vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    expect(window.location.pathname).toBe(
      "/provider/applications/application-1",
    );
    expect(window.location.search).toBe(
      "?listingId=listing-1&section=viewing&proposalId=proposal-1",
    );
  });
});
