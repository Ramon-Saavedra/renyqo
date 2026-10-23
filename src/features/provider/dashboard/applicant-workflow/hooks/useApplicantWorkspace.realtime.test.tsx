import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
  scheduleConversationSummary,
} from "@/lib/realtime/attention";
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
});
