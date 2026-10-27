import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  workflowCloseSchema,
  workflowCommandResultSchema,
  workflowCommandSchema,
  workflowInterestSchema,
  workflowOutcomeSchema,
  workflowScheduleSchema,
} from "./command-schema";
import { parseViewingCommandFailure } from "./errors";
import { proposalHistoryPageSchema } from "./history-schema";
import { viewingWorkflowSnapshotSchema } from "./snapshot-schema";

const AT = "2026-10-26T08:00:00.000Z";
const KEY = "6b0f8c62-34a5-4d0e-9a4d-1b6d2b8e1a01";

function target(action: string) {
  return {
    applicationId: "application-1",
    workflowId: "workflow-1",
    proposalId: null,
    appointmentId: null,
    section: "VIEWING" as const,
    action,
  };
}

function capability(action: "INVITE") {
  return {
    action,
    allowed: true,
    blockedReason: null,
    target: target(action),
  };
}

const emptySnapshot = {
  applicationId: "application-1",
  workflowId: null,
  workflowRevision: 0,
  mode: "EMPTY",
  reconciliationRequired: false,
  asOf: AT,
  confirmedAppointment: null,
  pendingProposal: null,
  latestProposal: null,
  latestAppointment: null,
  changeCutoffAt: null,
  outcome: null,
  applicantInterest: null,
  providerConsideration: null,
  closure: null,
  obligations: [],
  nextObligation: null,
  capabilities: [capability("INVITE")],
  nextRevalidateAt: null,
  state: null,
  mutationsBlockedReason: null,
  postViewing: null,
};

const command = { requestKey: KEY, expectedWorkflowRevision: 4 };

describe("viewing workflow snapshot", () => {
  it("parses an empty CURRENT snapshot", () => {
    expect(viewingWorkflowSnapshotSchema.parse(emptySnapshot).mode).toBe(
      "EMPTY",
    );
  });

  it("keeps a confirmed appointment beside a pending replacement", () => {
    const parsed = viewingWorkflowSnapshotSchema.parse({
      ...emptySnapshot,
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: 4,
      state: "OPEN",
      confirmedAppointment: {
        appointmentId: "appointment-1",
        status: "ACCEPTED",
        proposalId: "proposal-1",
        startsAt: "2026-10-28T16:00:00.000Z",
        endsAt: "2026-10-28T16:30:00.000Z",
        timeZone: "Europe/Berlin",
        cancellation: null,
        timing: "NORMAL",
        shortNotice: false,
      },
      pendingProposal: {
        proposalId: "proposal-2",
        round: 2,
        proposerSide: "APPLICANT",
        responderSide: "PROVIDER",
        startsAt: "2026-10-29T17:00:00.000Z",
        endsAt: "2026-10-29T17:30:00.000Z",
        timeZone: "Europe/Berlin",
        message: null,
        predecessorProposalId: "proposal-1",
        baseAppointmentId: "appointment-1",
        timing: "SHORT_NOTICE",
        shortNotice: true,
        responseDeadlineAt: "2026-10-27T08:00:00.000Z",
        acceptanceBlockedReason: null,
        resolution: "PENDING",
        resolvedAt: null,
        resolvedBy: null,
        effectiveResolution: "PENDING",
      },
      nextRevalidateAt: "2026-10-27T08:00:00.000Z",
    });
    expect(parsed.confirmedAppointment?.appointmentId).toBe("appointment-1");
    expect(parsed.pendingProposal?.baseAppointmentId).toBe("appointment-1");
    expect(parsed.pendingProposal?.effectiveResolution).toBe("PENDING");
  });

  it("rejects a revision sent as a string", () => {
    expect(
      viewingWorkflowSnapshotSchema.safeParse({
        ...emptySnapshot,
        workflowRevision: "4",
      }).success,
    ).toBe(false);
  });
});

describe("viewing workflow commands", () => {
  it("requires a numeric revision and a uuid request key", () => {
    expect(workflowCommandSchema.parse(command)).toEqual(command);
    expect(
      workflowCommandSchema.safeParse({
        ...command,
        expectedWorkflowRevision: "4",
      }).success,
    ).toBe(false);
    expect(
      workflowCommandSchema.safeParse({
        ...command,
        requestKey: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("accepts an offset schedule and rejects a local timestamp", () => {
    const schedule = {
      ...command,
      startsAt: "2026-10-28T16:00:00.000Z",
      endsAt: "2026-10-28T16:30:00.000Z",
      timeZone: "Europe/Berlin",
      shortNotice: false,
    };
    expect(workflowScheduleSchema.parse(schedule)).toEqual(schedule);
    expect(
      workflowScheduleSchema.safeParse({
        ...schedule,
        startsAt: "2026-10-28T18:00:00",
      }).success,
    ).toBe(false);
  });

  it("requires withdrawal confirmation only when interest ends the application", () => {
    expect(
      workflowInterestSchema.parse({
        ...command,
        interest: "STILL_INTERESTED",
      }).interest,
    ).toBe("STILL_INTERESTED");
    expect(
      workflowInterestSchema.safeParse({
        ...command,
        interest: "NOT_INTERESTED",
      }).success,
    ).toBe(false);
    const declined = workflowInterestSchema.parse({
      ...command,
      interest: "NOT_INTERESTED",
      confirmWithdrawal: true,
    });
    expect(declined.interest).toBe("NOT_INTERESTED");
    if (declined.interest === "NOT_INTERESTED") {
      expect(declined.confirmWithdrawal).toBe(true);
    }
  });

  it("requires absence attribution only for a no-show", () => {
    expect(
      workflowOutcomeSchema.safeParse({ ...command, outcome: "COMPLETED" })
        .success,
    ).toBe(true);
    expect(
      workflowOutcomeSchema.safeParse({
        ...command,
        outcome: "COMPLETED",
        absenceSide: "APPLICANT",
      }).success,
    ).toBe(false);
    expect(
      workflowOutcomeSchema.parse({
        ...command,
        outcome: "NO_SHOW",
        absenceSide: "PROVIDER",
      }).absenceSide,
    ).toBe("PROVIDER");
  });

  it("keeps explicit null close targets", () => {
    expect(
      workflowCloseSchema.parse({
        ...command,
        reason: "PROPERTY_UNAVAILABLE",
        proposalId: null,
        appointmentId: "appointment-1",
      }),
    ).toMatchObject({ proposalId: null, appointmentId: "appointment-1" });
  });

  it("parses a command result without treating it as a new snapshot", () => {
    expect(
      workflowCommandResultSchema.parse({
        applicationId: "application-1",
        workflowId: "workflow-1",
        workflowRevision: 5,
        proposalId: null,
        appointmentId: "appointment-1",
      }).workflowRevision,
    ).toBe(5);
  });
});

describe("viewing workflow errors", () => {
  it("parses a stale revision conflict", () => {
    const error = new ApiError(
      409,
      "changed",
      "http",
      "VIEWING_STATE_CHANGED",
      {
        statusCode: 409,
        code: "VIEWING_STATE_CHANGED",
        applicationId: "application-1",
        reason: "STALE_REVISION",
        currentWorkflowRevision: 12,
      },
    );
    expect(parseViewingCommandFailure(error)).toEqual({
      kind: "state-changed",
      applicationId: "application-1",
      reason: "STALE_REVISION",
      currentWorkflowRevision: 12,
    });
  });

  it("parses idempotency reuse and short-notice validation", () => {
    expect(
      parseViewingCommandFailure(
        new ApiError(409, "reused", "http", "VIEWING_IDEMPOTENCY_KEY_REUSED", {
          code: "VIEWING_IDEMPOTENCY_KEY_REUSED",
        }),
      ),
    ).toEqual({ kind: "idempotency-key-reused" });
    expect(
      parseViewingCommandFailure(
        new ApiError(400, "short", "http", "VIEWING_SHORT_NOTICE_REQUIRED", {
          code: "VIEWING_SHORT_NOTICE_REQUIRED",
        }),
      ),
    ).toEqual({ kind: "short-notice-required" });
  });

  it("leaves an unstructured conflict unrecognized", () => {
    expect(
      parseViewingCommandFailure(new ApiError(409, "conflict", "http")),
    ).toBeNull();
  });
});

describe("proposal history", () => {
  it("parses a page whose appointment can be absent", () => {
    const page = proposalHistoryPageSchema.parse({
      asOf: AT,
      applicationId: "application-1",
      workflowId: "workflow-1",
      reconciliationRequired: false,
      items: [],
      pagination: { limit: 20, hasMore: false, nextBeforeRound: null },
    });
    expect(page.pagination.nextBeforeRound).toBeNull();
  });
});
