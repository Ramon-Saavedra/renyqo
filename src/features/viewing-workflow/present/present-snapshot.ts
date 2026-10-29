import type {
  ViewingWorkflowProjection,
  WorkflowCapability,
  WorkflowObligation,
} from "@/lib/viewing-workflow/snapshot-schema";

export interface ViewingNavigationIds {
  readonly applicationId: string;
  readonly workflowId: string | null;
  readonly confirmedAppointmentId: string | null;
  readonly confirmedProposalId: string | null;
  readonly pendingProposalId: string | null;
  readonly pendingBaseAppointmentId: string | null;
  readonly outcomeAppointmentId: string | null;
  readonly interestAppointmentId: string | null;
  readonly considerationAppointmentId: string | null;
}

export interface ViewingPresentation {
  readonly applicationId: string;
  readonly workflowId: string | null;
  readonly workflowRevision: number;
  readonly mode: ViewingWorkflowProjection["mode"];
  readonly reconciliationRequired: boolean;
  readonly confirmed: ViewingWorkflowProjection["confirmedAppointment"];
  readonly pending: ViewingWorkflowProjection["pendingProposal"];
  readonly proposalDeadlineAt: string | null;
  readonly pendingShortNotice: boolean | null;
  readonly confirmedShortNotice: boolean | null;
  readonly outcome: ViewingWorkflowProjection["outcome"];
  readonly applicantInterest: ViewingWorkflowProjection["applicantInterest"];
  readonly providerConsideration: ViewingWorkflowProjection["providerConsideration"];
  readonly closure: ViewingWorkflowProjection["closure"];
  readonly capabilities: readonly WorkflowCapability[];
  readonly obligations: readonly WorkflowObligation[];
  readonly nextObligation: ViewingWorkflowProjection["nextObligation"];
  readonly nextRevalidateAt: string | null;
  readonly changeCutoffAt: string | null;
  readonly navigation: ViewingNavigationIds;
}

export function presentViewingSnapshot(
  projection: ViewingWorkflowProjection,
): ViewingPresentation {
  const confirmed = projection.confirmedAppointment;
  const pending = projection.pendingProposal;
  return {
    applicationId: projection.applicationId,
    workflowId: projection.workflowId,
    workflowRevision: projection.workflowRevision,
    mode: projection.mode,
    reconciliationRequired: projection.reconciliationRequired,
    confirmed,
    pending,
    proposalDeadlineAt: pending?.responseDeadlineAt ?? null,
    pendingShortNotice: pending?.shortNotice ?? null,
    confirmedShortNotice: confirmed?.shortNotice ?? null,
    outcome: projection.outcome,
    applicantInterest: projection.applicantInterest,
    providerConsideration: projection.providerConsideration,
    closure: projection.closure,
    capabilities: projection.capabilities,
    obligations: projection.obligations,
    nextObligation: projection.nextObligation,
    nextRevalidateAt: projection.nextRevalidateAt,
    changeCutoffAt: projection.changeCutoffAt,
    navigation: {
      applicationId: projection.applicationId,
      workflowId: projection.workflowId,
      confirmedAppointmentId: confirmed?.appointmentId ?? null,
      confirmedProposalId: confirmed?.proposalId ?? null,
      pendingProposalId: pending?.proposalId ?? null,
      pendingBaseAppointmentId: pending?.baseAppointmentId ?? null,
      outcomeAppointmentId: projection.outcome?.appointmentId ?? null,
      interestAppointmentId:
        projection.applicantInterest?.appointmentId ?? null,
      considerationAppointmentId:
        projection.providerConsideration?.appointmentId ?? null,
    },
  };
}
