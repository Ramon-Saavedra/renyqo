import type { ApiRequestOptions } from "@/lib/api/client";
import {
  workflowCloseSchema,
  workflowCommandSchema,
  workflowConsiderationSchema,
  workflowOutcomeSchema,
  workflowScheduleSchema,
} from "@/lib/viewing-workflow/command-schema";
import type {
  WorkflowCloseInput,
  WorkflowCommandInput,
  WorkflowCommandResult,
  WorkflowConsiderationInput,
  WorkflowOutcomeInput,
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
  return workflowPath("provider", applicationId);
}

export function getProviderViewingWorkflow(
  applicationId: string,
  options?: ApiRequestOptions,
): Promise<ViewingWorkflowSnapshot> {
  return readWorkflow(
    base(applicationId),
    viewingWorkflowSnapshotSchema,
    options,
  );
}

export async function getProviderProposalHistory(
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

export function getProviderProposal(
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

export function reconcileProviderViewingWorkflow(
  applicationId: string,
  body: WorkflowCommandInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/reconcile`,
    workflowCommandSchema,
    body,
  );
}

export function inviteToProviderViewing(
  applicationId: string,
  body: WorkflowScheduleInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/invitations`,
    workflowScheduleSchema,
    body,
  );
}

export function acceptProviderProposal(
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

export function rejectProviderProposal(
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

export function counterproposeProviderViewing(
  applicationId: string,
  proposalId: string,
  body: WorkflowScheduleInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/counterproposal`,
    workflowScheduleSchema,
    body,
  );
}

export function proposeProviderReplacement(
  applicationId: string,
  appointmentId: string,
  body: WorkflowScheduleInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/replacement`,
    workflowScheduleSchema,
    body,
  );
}

export function closeProviderViewingWorkflow(
  applicationId: string,
  workflowId: string,
  body: WorkflowCloseInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/${encodeURIComponent(workflowId)}/close`,
    workflowCloseSchema,
    body,
  );
}

export function recordProviderViewingOutcome(
  applicationId: string,
  appointmentId: string,
  body: WorkflowOutcomeInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/outcome`,
    workflowOutcomeSchema,
    body,
  );
}

export function setProviderViewingConsideration(
  applicationId: string,
  appointmentId: string,
  body: WorkflowConsiderationInput,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/consideration`,
    workflowConsiderationSchema,
    body,
  );
}
