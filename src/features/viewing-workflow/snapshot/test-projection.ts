import {
  viewingWorkflowProjectionSchema,
  viewingWorkflowSnapshotSchema,
  type ViewingWorkflowProjection,
  type ViewingWorkflowSnapshot,
} from "@/lib/viewing-workflow/snapshot-schema";

export const VIEWING_APPLICATION_ID = "application-1";
export const VIEWING_AT = "2026-10-26T08:00:00.000Z";

function target(action: string) {
  return {
    applicationId: VIEWING_APPLICATION_ID,
    workflowId: "workflow-1",
    proposalId: null,
    appointmentId: null,
    section: "VIEWING" as const,
    action,
  };
}

const base = {
  applicationId: VIEWING_APPLICATION_ID,
  workflowId: null as string | null,
  workflowRevision: 0,
  mode: "EMPTY" as const,
  reconciliationRequired: false,
  asOf: VIEWING_AT,
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
  capabilities: [
    {
      action: "INVITE" as const,
      allowed: true,
      blockedReason: null,
      target: target("INVITE"),
    },
  ],
  nextRevalidateAt: null as string | null,
};

export function viewingProjection(
  overrides: object = {},
): ViewingWorkflowProjection {
  return viewingWorkflowProjectionSchema.parse({ ...base, ...overrides });
}

export function viewingSnapshot(
  overrides: object = {},
): ViewingWorkflowSnapshot {
  return viewingWorkflowSnapshotSchema.parse({
    ...base,
    state: null,
    mutationsBlockedReason: null,
    postViewing: null,
    ...overrides,
  });
}

export const confirmedAppointment = {
  appointmentId: "appointment-1",
  status: "ACCEPTED" as const,
  proposalId: "proposal-1",
  startsAt: "2026-10-28T16:00:00.000Z",
  endsAt: "2026-10-28T16:30:00.000Z",
  timeZone: "Europe/Berlin",
  cancellation: null,
  timing: "NORMAL" as const,
  shortNotice: false,
};

export const pendingReplacement = {
  proposalId: "proposal-2",
  round: 2,
  proposerSide: "APPLICANT" as const,
  responderSide: "PROVIDER" as const,
  startsAt: "2026-10-29T17:00:00.000Z",
  endsAt: "2026-10-29T17:30:00.000Z",
  timeZone: "Europe/Berlin",
  message: null,
  predecessorProposalId: "proposal-1",
  baseAppointmentId: "appointment-1",
  timing: "SHORT_NOTICE" as const,
  shortNotice: true,
  responseDeadlineAt: "2026-10-27T08:00:00.000Z",
  acceptanceBlockedReason: null,
  resolution: "PENDING" as const,
  resolvedAt: null,
  resolvedBy: null,
  effectiveResolution: "PENDING" as const,
};
