import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
  scheduleConversationSummary,
} from "@/lib/realtime/attention";
import { invalidateListingApplicationData } from "../../listings/utils/listing-data-invalidation";
import { APPLICATION_ID, createWorkspace } from "../testing/fixtures";
import type * as workspaceApi from "../api/workspace";
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

vi.mock("../../listings/utils/listing-data-invalidation", () => ({
  invalidateListingApplicationData: vi.fn(),
  subscribeListingApplicationData: () => () => undefined,
}));

describe("applicant workspace realtime refresh", () => {
  beforeEach(() => {
    getApplicantWorkspace.mockReset();
    getApplicantWorkspace.mockResolvedValue(createWorkspace());
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reloads the workspace for summary events and not for new messages", async () => {
    const { result } = renderHook(() => useApplicantWorkspace(APPLICATION_ID));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    scheduleConversationMessage("applicant", APPLICATION_ID);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(1);
    expect(invalidateListingApplicationData).not.toHaveBeenCalled();

    scheduleConversationSummary("applicant", APPLICATION_ID);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(2);
    expect(invalidateListingApplicationData).not.toHaveBeenCalled();
  });
});
