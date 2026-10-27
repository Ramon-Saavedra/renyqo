import { describe, expect, it } from "vitest";
import { presentViewingSnapshot } from "./present-snapshot";
import {
  confirmedAppointment,
  pendingReplacement,
  VIEWING_APPLICATION_ID,
  viewingProjection,
} from "../snapshot/test-projection";

const blockedInvite = {
  action: "INVITE" as const,
  allowed: false,
  blockedReason: "LEGACY_RECONCILIATION_REQUIRED",
  target: {
    applicationId: VIEWING_APPLICATION_ID,
    workflowId: "workflow-1",
    proposalId: null,
    appointmentId: null,
    section: "VIEWING" as const,
    action: "INVITE",
  },
};

const obligation = {
  action: "APPLICANT_RESPOND_TO_VIEWING" as const,
  responsibleSide: "APPLICANT" as const,
  deadlineAt: "2026-10-27T08:00:00.000Z",
  target: {
    applicationId: VIEWING_APPLICATION_ID,
    workflowId: "workflow-1",
    proposalId: "proposal-2",
    appointmentId: "appointment-1",
    section: "VIEWING" as const,
    action: "RESPOND_TO_PROPOSAL",
  },
};

describe("present viewing snapshot", () => {
  it("presents a confirmed appointment on its own", () => {
    const presentation = presentViewingSnapshot(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 4,
        confirmedAppointment,
      }),
    );

    expect(presentation.confirmed?.appointmentId).toBe("appointment-1");
    expect(presentation.pending).toBeNull();
    expect(presentation.proposalDeadlineAt).toBeNull();
    expect(presentation.navigation.confirmedAppointmentId).toBe(
      "appointment-1",
    );
    expect(presentation.navigation.pendingProposalId).toBeNull();
  });

  it("presents a pending proposal on its own", () => {
    const presentation = presentViewingSnapshot(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 2,
        pendingProposal: pendingReplacement,
        latestProposal: {
          ...pendingReplacement,
          proposalId: "proposal-old",
          effectiveResolution: "SUPERSEDED",
          resolution: "SUPERSEDED",
        },
      }),
    );

    expect(presentation.confirmed).toBeNull();
    expect(presentation.pending?.proposalId).toBe("proposal-2");
    expect(presentation.pending?.proposalId).not.toBe("proposal-old");
    expect(presentation.proposalDeadlineAt).toBe("2026-10-27T08:00:00.000Z");
    expect(presentation.pendingShortNotice).toBe(true);
  });

  it("keeps a confirmed appointment beside a pending replacement", () => {
    const presentation = presentViewingSnapshot(
      viewingProjection({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 4,
        confirmedAppointment,
        pendingProposal: pendingReplacement,
        nextRevalidateAt: "2026-10-27T08:00:00.000Z",
      }),
    );

    expect(presentation.confirmed?.appointmentId).toBe("appointment-1");
    expect(presentation.confirmed?.startsAt).toBe("2026-10-28T16:00:00.000Z");
    expect(presentation.pending?.proposalId).toBe("proposal-2");
    expect(presentation.pending?.baseAppointmentId).toBe("appointment-1");
    expect(presentation.pending?.startsAt).toBe("2026-10-29T17:00:00.000Z");
    expect(presentation.navigation.confirmedAppointmentId).toBe(
      "appointment-1",
    );
    expect(presentation.navigation.pendingBaseAppointmentId).toBe(
      "appointment-1",
    );
    expect(presentation.nextRevalidateAt).toBe("2026-10-27T08:00:00.000Z");
    expect(presentation.workflowRevision).toBe(4);
  });

  it("passes capabilities and obligations through unchanged", () => {
    const presentation = presentViewingSnapshot(
      viewingProjection({
        mode: "LEGACY",
        reconciliationRequired: true,
        capabilities: [blockedInvite],
        obligations: [obligation],
        nextObligation: obligation,
        outcome: {
          appointmentId: "appointment-1",
          startsAt: confirmedAppointment.startsAt,
          endsAt: confirmedAppointment.endsAt,
          timeZone: "Europe/Berlin",
          outcome: "COMPLETED",
          absenceSide: null,
          revision: 1,
          recordedAt: "2026-10-28T17:00:00.000Z",
          correctionCutoffAt: null,
        },
        applicantInterest: {
          appointmentId: "appointment-1",
          state: "PENDING",
          storedState: "PENDING",
          deadlineAt: "2026-10-29T17:00:00.000Z",
          respondedAt: null,
          lifecycleExpiryPending: false,
        },
        providerConsideration: {
          state: "UNDECIDED",
          decidedAt: null,
          appointmentId: "appointment-1",
          decisionRequired: false,
        },
        closure: {
          state: "OPEN",
          reason: null,
          closedAt: null,
        },
      }),
    );

    expect(presentation.capabilities).toEqual([blockedInvite]);
    expect(presentation.capabilities[0]?.allowed).toBe(false);
    expect(presentation.obligations).toEqual([obligation]);
    expect(presentation.nextObligation).toEqual(obligation);
    expect(presentation.outcome?.outcome).toBe("COMPLETED");
    expect(presentation.applicantInterest?.state).toBe("PENDING");
    expect(presentation.providerConsideration?.state).toBe("UNDECIDED");
    expect(presentation.closure?.state).toBe("OPEN");
    expect(presentation.reconciliationRequired).toBe(true);
    expect(presentation.navigation.outcomeAppointmentId).toBe("appointment-1");
    expect(presentation.navigation.interestAppointmentId).toBe("appointment-1");
    expect(presentation.navigation.considerationAppointmentId).toBe(
      "appointment-1",
    );
  });
});
