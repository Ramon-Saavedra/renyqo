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
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/reconcile`,
    workflowCommandSchema,
    body,
    providerOptions,
  );
}

export function inviteToProviderViewing(
  applicationId: string,
  body: WorkflowScheduleInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/invitations`,
    workflowScheduleSchema,
    body,
    providerOptions,
  );
}

export function acceptProviderProposal(
  applicationId: string,
  proposalId: string,
  body: WorkflowCommandInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/accept`,
    workflowCommandSchema,
    body,
    providerOptions,
  );
}

export function rejectProviderProposal(
  applicationId: string,
  proposalId: string,
  body: WorkflowCommandInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/reject`,
    workflowCommandSchema,
    body,
    providerOptions,
  );
}

export function counterproposeProviderViewing(
  applicationId: string,
  proposalId: string,
  body: WorkflowScheduleInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/proposals/${encodeURIComponent(proposalId)}/counterproposal`,
    workflowScheduleSchema,
    body,
    providerOptions,
  );
}

export function proposeProviderReplacement(
  applicationId: string,
  appointmentId: string,
  body: WorkflowScheduleInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/replacement`,
    workflowScheduleSchema,
    body,
    providerOptions,
  );
}

export function closeProviderViewingWorkflow(
  applicationId: string,
  workflowId: string,
  body: WorkflowCloseInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/${encodeURIComponent(workflowId)}/close`,
    workflowCloseSchema,
    body,
    providerOptions,
  );
}

export function recordProviderViewingOutcome(
  applicationId: string,
  appointmentId: string,
  body: WorkflowOutcomeInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/outcome`,
    workflowOutcomeSchema,
    body,
    providerOptions,
  );
}

export function setProviderViewingConsideration(
  applicationId: string,
  appointmentId: string,
  body: WorkflowConsiderationInput,
  providerOptions?: ApiRequestOptions,
): Promise<WorkflowCommandResult> {
  return postWorkflowCommand(
    `${base(applicationId)}/appointments/${encodeURIComponent(appointmentId)}/consideration`,
    workflowConsiderationSchema,
    body,
    providerOptions,
  );
}
