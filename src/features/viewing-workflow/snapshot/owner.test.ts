import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationSummary,
  scheduleRealtimeResync,
  scheduleViewingChanged,
} from "@/lib/realtime/attention";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";
import { commitViewingCommand } from "./command";
import {
  ensureViewingSnapshot,
  getViewingSnapshotState,
  invalidateViewingSnapshot,
  publishViewingSnapshot,
  refetchViewingSnapshot,
  resetViewingSnapshotsForTests,
  subscribeViewingSnapshot,
} from "./owner";
import { subscribeViewingSnapshotSession } from "./session-refresh";
import {
  pendingReplacement,
  VIEWING_APPLICATION_ID,
  viewingProjection,
  viewingSnapshot,
} from "./test-projection";

const getApplicantViewingWorkflow = vi.hoisted(() => vi.fn());
const getProviderViewingWorkflow = vi.hoisted(() => vi.fn());

vi.mock("@/features/viewing-workflow/api/applicant-workflow", () => ({
  getApplicantViewingWorkflow,
}));

vi.mock("@/features/viewing-workflow/api/provider-workflow", () => ({
  getProviderViewingWorkflow,
}));

const ID = VIEWING_APPLICATION_ID;
const RESULT: WorkflowCommandResult = {
  applicationId: ID,
  workflowId: "workflow-1",
  workflowRevision: 5,
  proposalId: "proposal-2",
  appointmentId: null,
};
const REQUEST_KEY = "6b0f8c62-34a5-4d0e-9a4d-1b6d2b8e1a01";

function publish(
  projection: ReturnType<typeof viewingProjection>,
  source: "workspace" | "workflow" = "workspace",
) {
  publishViewingSnapshot(projection, {
    side: "applicant",
    source,
    listingId: null,
    snapshot: source === "workflow" ? viewingSnapshot(projection) : null,
  });
}

describe("viewing snapshot owner", () => {
  afterEach(() => {
    resetViewingSnapshotsForTests();
    resetRealtimeSchedules();
    vi.useRealTimers();
    getApplicantViewingWorkflow.mockReset();
    getProviderViewingWorkflow.mockReset();
  });

  it("publishes a CURRENT snapshot and replaces it when a newer one arrives", () => {
    publish(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 2,
        asOf: "2026-10-26T08:00:00.000Z",
      }),
    );
    publish(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 1,
        asOf: "2026-10-26T07:00:00.000Z",
      }),
    );
    expect(getViewingSnapshotState(ID).projection?.workflowRevision).toBe(2);

    publish(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 3,
        asOf: "2026-10-26T09:00:00.000Z",
      }),
      "workflow",
    );
    const state = getViewingSnapshotState(ID);
    expect(state.status).toBe("ready");
    expect(state.projection?.workflowRevision).toBe(3);
    expect(state.snapshot?.workflowRevision).toBe(3);
  });

  it("stores EMPTY and LEGACY without calling a viewing endpoint", () => {
    publish(viewingProjection({ mode: "EMPTY" }));
    publish(
      viewingProjection({
        mode: "LEGACY",
        reconciliationRequired: true,
        asOf: "2026-10-26T09:00:00.000Z",
        capabilities: [
          {
            action: "INVITE",
            allowed: false,
            blockedReason: "LEGACY_RECONCILIATION_REQUIRED",
            target: {
              applicationId: ID,
              workflowId: null,
              proposalId: null,
              appointmentId: null,
              section: "VIEWING",
              action: "INVITE",
            },
          },
        ],
      }),
    );

    expect(getViewingSnapshotState(ID).projection?.mode).toBe("LEGACY");
    expect(getViewingSnapshotState(ID).projection?.reconciliationRequired).toBe(
      true,
    );
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
    expect(getProviderViewingWorkflow).not.toHaveBeenCalled();
  });

  it("keeps the CURRENT snapshot when the workflow fetch fails", async () => {
    publish(viewingProjection({ mode: "CURRENT", workflowRevision: 4 }));
    getApplicantViewingWorkflow.mockRejectedValue(
      new ApiError(500, "unavailable", "http"),
    );

    await refetchViewingSnapshot(ID);

    const state = getViewingSnapshotState(ID);
    expect(state.status).toBe("ready");
    expect(state.projection?.mode).toBe("CURRENT");
    expect(state.error).toBe("request");
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(getProviderViewingWorkflow).not.toHaveBeenCalled();
  });

  it("coalesces concurrent fetches for one application", async () => {
    let resolveGet: (value: ReturnType<typeof viewingSnapshot>) => void = () =>
      undefined;
    getApplicantViewingWorkflow.mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );

    const first = refetchViewingSnapshot(ID, "applicant");
    const second = refetchViewingSnapshot(ID, "applicant");

    expect(first).toBe(second);
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    resolveGet(viewingSnapshot({ mode: "CURRENT" }));
    await first;
    expect(getViewingSnapshotState(ID).projection?.mode).toBe("CURRENT");
  });

  it("does not fetch again when the embedded snapshot is already current", async () => {
    publish(viewingProjection({ mode: "CURRENT", workflowRevision: 4 }));
    await ensureViewingSnapshot(ID, "applicant");
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
  });

  it("refetches at nextRevalidateAt without changing the proposal locally", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
    let resolveGet: (value: ReturnType<typeof viewingSnapshot>) => void = () =>
      undefined;
    getApplicantViewingWorkflow.mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );
    const current = viewingProjection({
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: 4,
      pendingProposal: pendingReplacement,
      nextRevalidateAt: "2026-10-26T07:00:00.000Z",
    });
    subscribeViewingSnapshot(ID, () => undefined);
    publish(current);

    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(
      getViewingSnapshotState(ID).projection?.pendingProposal
        ?.effectiveResolution,
    ).toBe("PENDING");

    resolveGet(viewingSnapshot(current));
    await refetchViewingSnapshot(ID);
    expect(
      getViewingSnapshotState(ID).projection?.pendingProposal
        ?.effectiveResolution,
    ).toBe("PENDING");
  });

  it("refetches when the scheduled deadline is reached", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({
        mode: "CURRENT",
        workflowRevision: 2,
        asOf: "2026-10-26T08:00:10.000Z",
        nextRevalidateAt: null,
      }),
    );
    subscribeViewingSnapshot(ID, () => undefined);
    publish(
      viewingProjection({
        mode: "CURRENT",
        nextRevalidateAt: "2026-10-26T08:00:10.000Z",
      }),
    );

    await vi.advanceTimersByTimeAsync(9_999);
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(getViewingSnapshotState(ID).projection?.workflowRevision).toBe(2);
  });

  it("replaces the deadline timer and cancels it when the boundary disappears", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", nextRevalidateAt: null }),
    );
    subscribeViewingSnapshot(ID, () => undefined);
    publish(
      viewingProjection({
        mode: "CURRENT",
        nextRevalidateAt: "2026-10-26T08:00:10.000Z",
      }),
    );
    publish(
      viewingProjection({
        mode: "CURRENT",
        asOf: "2026-10-26T08:00:01.000Z",
        workflowRevision: 1,
        nextRevalidateAt: "2026-10-26T08:00:20.000Z",
      }),
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();

    publish(
      viewingProjection({
        mode: "CURRENT",
        asOf: "2026-10-26T08:00:02.000Z",
        workflowRevision: 2,
        nextRevalidateAt: null,
      }),
    );
    await vi.advanceTimersByTimeAsync(20_000);
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
  });

  it("refetches a subscribed snapshot on focus and on the realtime resync", async () => {
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", workflowRevision: 4 }),
    );
    const unsubscribe = subscribeViewingSnapshotSession(ID, () => undefined);
    publish(viewingProjection({ mode: "CURRENT", workflowRevision: 4 }));
    getApplicantViewingWorkflow.mockClear();

    window.dispatchEvent(new Event("focus"));
    await vi.waitFor(() => {
      expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    });

    getApplicantViewingWorkflow.mockClear();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    vi.useFakeTimers();
    scheduleRealtimeResync("applicant");
    await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);

    getApplicantViewingWorkflow.mockClear();
    scheduleConversationSummary("applicant", "someone-else");
    await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("refetches one subscribed snapshot for a coalesced viewing hint", async () => {
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", workflowRevision: 4 }),
    );
    const unsubscribe = subscribeViewingSnapshotSession(ID, () => undefined);
    publish(viewingProjection({ mode: "CURRENT", workflowRevision: 4 }));
    getApplicantViewingWorkflow.mockClear();

    vi.useFakeTimers();
    scheduleViewingChanged("applicant", ID, "listing-1");
    scheduleViewingChanged("applicant", ID, "listing-1");
    await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);

    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("refetches after a successful command and keeps the caller's request key", async () => {
    const seen: string[] = [];
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", workflowRevision: 5 }),
    );
    const outcome = await commitViewingCommand(ID, "applicant", async () => {
      seen.push(REQUEST_KEY);
      return RESULT;
    });

    expect(outcome).toEqual({ status: "success", result: RESULT });
    expect(seen).toEqual([REQUEST_KEY]);
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(getViewingSnapshotState(ID).projection?.workflowRevision).toBe(5);
  });

  it("refetches a stale 409 once and returns the conflict to the caller", async () => {
    const command = vi.fn(async () => {
      throw new ApiError(409, "changed", "http", "VIEWING_STATE_CHANGED", {
        code: "VIEWING_STATE_CHANGED",
        applicationId: ID,
        reason: "STALE_REVISION",
        currentWorkflowRevision: 9,
      });
    });
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", workflowRevision: 9 }),
    );

    const outcome = await commitViewingCommand(ID, "applicant", command);

    expect(command).toHaveBeenCalledTimes(1);
    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(outcome).toMatchObject({
      status: "conflict",
      failure: { kind: "state-changed", currentWorkflowRevision: 9 },
    });
    expect(getViewingSnapshotState(ID).projection?.workflowRevision).toBe(9);
  });

  it("returns a short-notice failure without refetching or retrying", async () => {
    const command = vi.fn(async () => {
      throw new ApiError(
        400,
        "short notice",
        "http",
        "VIEWING_SHORT_NOTICE_REQUIRED",
        {
          code: "VIEWING_SHORT_NOTICE_REQUIRED",
        },
      );
    });

    const outcome = await commitViewingCommand(ID, "applicant", command);

    expect(command).toHaveBeenCalledTimes(1);
    expect(getApplicantViewingWorkflow).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: "error",
      failure: { kind: "short-notice-required" },
    });
  });

  it("invalidates one application through the workflow GET", async () => {
    publish(viewingProjection({ mode: "CURRENT", workflowRevision: 2 }));
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({ mode: "CURRENT", workflowRevision: 6 }),
    );

    await invalidateViewingSnapshot(ID);

    expect(getApplicantViewingWorkflow).toHaveBeenCalledTimes(1);
    expect(getViewingSnapshotState(ID).projection?.workflowRevision).toBe(6);
  });
});
