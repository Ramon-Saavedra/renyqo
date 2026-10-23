import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
} from "@/lib/realtime/attention";
import type { ApplicantApplicationsPage } from "../api/overview";
import type * as overviewApi from "../api/overview";
import { useApplicationsOverview } from "./useApplicationsOverview";

const getApplicantApplicationsOverview = vi.hoisted(() => vi.fn());

vi.mock("../api/overview", async (importOriginal) => {
  const actual = await importOriginal<typeof overviewApi>();
  return { ...actual, getApplicantApplicationsOverview };
});

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

const page: ApplicantApplicationsPage = {
  asOf: "2026-10-22T08:00:00.000Z",
  items: [],
  pagination: { limit: 20, hasMore: false, nextCursor: null },
  totalCount: 0,
  counts: { all: 0, active: 0, waiting: 0, done: 0 },
};

describe("applicant overview realtime refresh", () => {
  beforeEach(() => {
    getApplicantApplicationsOverview.mockReset();
    getApplicantApplicationsOverview.mockResolvedValue(page);
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reloads the overview once for a coalesced message burst", async () => {
    const { result } = renderHook(() => useApplicationsOverview("ALL"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(getApplicantApplicationsOverview).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    scheduleConversationMessage("applicant", "application-1");
    scheduleConversationMessage("applicant", "application-2");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getApplicantApplicationsOverview).toHaveBeenCalledTimes(2);
  });
});
