import type { ApiRequestOptions } from "@/lib/api/client";
import {
  workflowCancelSchema,
  workflowCommandSchema,
  workflowInterestSchema,
  workflowScheduleSchema,
} from "@/lib/viewing-workflow/command-schema";
import type {
  WorkflowCancelInput,
  WorkflowCommandInput,
  WorkflowCommandResult,
  WorkflowInterestInput,
  WorkflowScheduleInput,
} from "@/lib/viewing-workflow/command-schema";
import {
  proposalHistoryItemSchema,
  proposalHistoryPageSchema,
} from "@/lib/viewing-workflow/history-schema";
import type {
  ProposalHistoryItem,
  ProposalHistoryPage,
} from "@/lib/viewing-workflow/history-schema";
import { viewingWorkflowSnapshotSchema } from "@/lib/viewing-workflow/snapshot-schema";
import type { ViewingWorkflowSnapshot } from "@/lib/viewing-workflow/snapshot-schema";
import {
  proposalHistorySearch,
  type ProposalHistoryQuery,
} from "./history-query";
import { postWorkflowCommand, readWorkflow, workflowPath } from "./transport";

function base(applicationId: string): string {
  return workflowPath("applicant", applicationId);
}

export function getApplicantViewingWorkflow(
  applicationId: string,
  options?: ApiRequestOptions,
): Promise<ViewingWorkflowSnapshot> {
  return readWorkflow(
    base(applicationId),
    viewingWorkflowSnapshotSchema,
    options,
  );
}

export async function getApplicantProposalHistory(
  applicationId: string,
  query?: ProposalHistoryQuery,
  options?: ApiRequestOptions,
): Promise<ProposalHistoryPage> {
  const search = proposalHistorySearch(query);
  return readWorkflow(
    `${base(applicationId)}/proposals?${search}`,
    proposalHistoryPageSchema,
    options,
  );
}

export function getApplicantProposal(
  applicationId: string,
  proposalId: string,
  options?: ApiRequestOptions,
): Promise<ProposalHistoryItem> {
  return readWorkflow(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}`,
    proposalHistoryItemSchema,
    options,
  );
}

export function reconcileApplicantViewingWorkflow(
  applicationId: string,
  body: WorkflowCommandInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/reconcile`,
    workflowCommandSchema,
    body,
  );
}

export function acceptApplicantProposal(
  applicationId: string,
  proposalId: string,
  body: WorkflowCommandInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/accept`,
    workflowCommandSchema,
    body,
  );
}

export function rejectApplicantProposal(
  applicationId: string,
  proposalId: string,
  body: WorkflowCommandInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/reject`,
    workflowCommandSchema,
    body,
  );
}

export function proposeApplicantAlternative(
  applicationId: string,
  proposalId: string,
  body: WorkflowScheduleInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/alternative`,
    workflowScheduleSchema,
    body,
  );
}

export function proposeApplicantAppointmentAlternative(
  applicationId: string,
  appointmentId: string,
  body: WorkflowScheduleInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/alternative`,
    workflowScheduleSchema,
    body,
  );
}

export function withdrawApplicantAlternative(
  applicationId: string,
  proposalId: string,
  body: WorkflowCommandInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/withdraw`,
    workflowCommandSchema,
    body,
  );
}

export function cancelApplicantAppointment(
  applicationId: string,
  appointmentId: string,
  body: WorkflowCancelInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    workflowCancelSchema,
    body,
  );
}

export function submitApplicantViewingInterest(
  applicationId: string,
  appointmentId: string,
  body: WorkflowInterestInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/interest`,
    workflowInterestSchema,
    body,
  );
}
