"use client";

import { ConfirmedAppointmentBlock } from "@/features/applicant/applications/components/workspace/current-viewing/ConfirmedAppointmentBlock";
import { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";
import { ProviderCloseFlow } from "./ProviderCloseFlow";
import { ProviderConsiderationBlock } from "./ProviderConsiderationBlock";
import { ProviderInterestLine } from "./ProviderInterestLine";
import { ProviderOutcome } from "./ProviderOutcome";
import { ProviderPendingBlock } from "./ProviderPendingBlock";
import { ProviderReadOnlyFacts } from "./ProviderReadOnlyFacts";
import { ProviderScheduleForm } from "./ProviderScheduleForm";

export function ProviderCurrentViewing({
  applicationId,
  projection,
  refreshError,
  onChanged,
}: {
  readonly applicationId: string;
  readonly projection: ViewingWorkflowProjection;
  readonly refreshError: boolean;
  readonly onChanged: () => void;
}) {
  const commands = useViewingCommands(
    applicationId,
    "provider",
    projection.workflowRevision,
    onChanged,
  );
  const confirmed = projection.confirmedAppointment;
  const pending = projection.pendingProposal;
  const invite = allowedCapability(projection.capabilities, "INVITE");
  const quietEmpty =
    projection.mode === "EMPTY" &&
    confirmed === null &&
    pending === null &&
    !invite;

  return (
    <div className="flex flex-col gap-3">
      {commands.notice === "stale" ? (
        <p role="alert" className="text-caption text-warning">
          {copy.stale}
        </p>
      ) : null}
      {commands.notice === "error" ? (
        <p role="alert" className="text-caption text-warning">
          {commands.errorMessage ?? copy.actionError}
        </p>
      ) : null}
      {refreshError ? (
        <p role="alert" className="text-caption text-warning">
          {copy.refreshError}
        </p>
      ) : null}
      {quietEmpty ? (
        <div className="flex flex-col gap-1">
          <p className="text-lead font-medium text-foreground">
            {copy.emptyTitle}
          </p>
          <p className="text-body text-foreground-secondary">
            {copy.emptyText}
          </p>
        </div>
      ) : null}
      {confirmed ? (
        <ConfirmedAppointmentBlock
          appointment={confirmed}
          replacementPending={pending !== null}
        />
      ) : null}
      {pending ? (
        <ProviderPendingBlock
          applicationId={applicationId}
          proposal={pending}
          confirmed={confirmed !== null}
          capabilities={projection.capabilities}
          commands={commands}
        />
      ) : null}
      <ProviderScheduleForm
        applicationId={applicationId}
        capabilities={projection.capabilities}
        commands={commands}
      />
      <ProviderCloseFlow
        applicationId={applicationId}
        workflowId={projection.workflowId}
        capabilities={projection.capabilities}
        commands={commands}
      />
      <ProviderOutcome
        applicationId={applicationId}
        outcome={projection.outcome}
        capabilities={projection.capabilities}
        commands={commands}
      />
      <ProviderInterestLine interest={projection.applicantInterest} />
      <ProviderConsiderationBlock
        applicationId={applicationId}
        consideration={projection.providerConsideration}
        capabilities={projection.capabilities}
        commands={commands}
      />
      <ProviderReadOnlyFacts projection={projection} />
    </div>
  );
}
