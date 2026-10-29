import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
  scheduleConversationSummary,
  scheduleListingApplicationsChanged,
} from "@/lib/realtime/attention";
import { WorkspaceInaccessibleError } from "../api/workspace";
import type * as workspaceApi from "../api/workspace";
import { createApplicantWorkspace } from "../testing/workspace-fixture";
import { useApplicantWorkspace } from "./useApplicantWorkspace";

const getApplicantWorkspace = vi.hoisted(() => vi.fn());

vi.mock("../api/workspace", async (importOriginal) => {
  const actual = await importOriginal<typeof workspaceApi>();
  return { ...actual, getApplicantWorkspace };
});

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

describe("provider workspace realtime refresh", () => {
  beforeEach(() => {
    getApplicantWorkspace.mockReset();
    getApplicantWorkspace.mockResolvedValue(createApplicantWorkspace());
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reloads the open workspace for summary events only", async () => {
    const { result } = renderHook(() => useApplicantWorkspace("application-1"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    scheduleConversationMessage("provider", "application-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(1);

    scheduleConversationSummary("provider", "application-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(2);
  });

  it("drops the open workspace when the refetch is no longer authorized", async () => {
    window.history.replaceState(
      null,
      "",
      "/provider/applications/application-1?listingId=listing-1&section=messages",
    );
    const { result } = renderHook(() => useApplicantWorkspace("application-1"));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    getApplicantWorkspace.mockRejectedValue(new WorkspaceInaccessibleError());

    vi.useFakeTimers();
    scheduleListingApplicationsChanged("provider", "listing-1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });

    expect(result.current.state.status).toBe("inaccessible");
    expect(window.location.pathname).toBe(
      "/provider/applications/application-1",
    );
    expect(window.location.search).toBe(
      "?listingId=listing-1&section=messages",
    );
  });
});
