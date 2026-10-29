import { Calendar } from "lucide-react";
import type { Ref } from "react";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { allowedCapability } from "../../../model/viewing-capability";
import { WorkspaceSection } from "../../WorkspaceSection";
import { AlternativeScheduleForm } from "./AlternativeScheduleForm";
import { CancelAppointment } from "./CancelAppointment";
import { ConfirmedAppointmentBlock } from "./ConfirmedAppointmentBlock";
import { currentViewingCopy as copy } from "./copy";
import { InterestResponse } from "./InterestResponse";
import { PendingProposalBlock } from "./PendingProposalBlock";
import {
  ReadOnlyViewingFacts,
  readOnlyViewingFacts,
} from "./ReadOnlyViewingFacts";
import { hasRenderableInterest } from "./renderable-interest";
import { useApplicantViewingCommands } from "./useApplicantViewingCommands";

function hasRenderableCurrentViewing(
  projection: ViewingWorkflowProjection,
): boolean {
  if (projection.mode === "EMPTY") return false;
  return Boolean(
    projection.confirmedAppointment ||
    projection.pendingProposal ||
    allowedCapability(projection.capabilities, "COUNTERPROPOSE") ||
    allowedCapability(projection.capabilities, "PROPOSE_REPLACEMENT") ||
    allowedCapability(projection.capabilities, "CANCEL_APPOINTMENT") ||
    hasRenderableInterest(projection) ||
    readOnlyViewingFacts(projection).length > 0,
  );
}

function isEmpty(projection: ViewingWorkflowProjection): boolean {
  return !hasRenderableCurrentViewing(projection);
}

export function CurrentViewingSection({
  applicationId,
  projection,
  refreshError,
  onChanged,
  highlighted,
  sectionRef,
  className,
}: {
  readonly applicationId: string;
  readonly projection: ViewingWorkflowProjection;
  readonly refreshError: boolean;
  readonly onChanged: () => void;
  readonly highlighted: boolean;
  readonly sectionRef: Ref<HTMLElement>;
  readonly className?: string | undefined;
}) {
  const commands = useApplicantViewingCommands(
    applicationId,
    projection.workflowRevision,
    onChanged,
  );

  return (
    <WorkspaceSection
      icon={Calendar}
      title="Besichtigung"
      sectionKey="viewing"
      highlighted={highlighted}
      sectionRef={sectionRef}
      className={className}
    >
      <div className="flex flex-col gap-3 px-3.5 py-4 sm:px-5">
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
          <p className="text-caption text-foreground-secondary">
            {copy.refreshError}
          </p>
        ) : null}
        {isEmpty(projection) ? (
          <div>
            <p className="text-lead font-medium text-foreground">
              {copy.emptyTitle}
            </p>
            <p className="mt-0.5 text-body text-foreground-secondary">
              {copy.emptyText}
            </p>
          </div>
        ) : (
          <>
            {projection.confirmedAppointment ? (
              <ConfirmedAppointmentBlock
                appointment={projection.confirmedAppointment}
                replacementPending={projection.pendingProposal !== null}
              />
            ) : null}
            {projection.pendingProposal ? (
              <PendingProposalBlock
                applicationId={applicationId}
                proposal={projection.pendingProposal}
                capabilities={projection.capabilities}
                commands={commands}
              />
            ) : null}
            <AlternativeScheduleForm
              applicationId={applicationId}
              capabilities={projection.capabilities}
              commands={commands}
            />
            <CancelAppointment
              applicationId={applicationId}
              capabilities={projection.capabilities}
              commands={commands}
            />
            <InterestResponse
              applicationId={applicationId}
              projection={projection}
              commands={commands}
            />
            <ReadOnlyViewingFacts projection={projection} />
          </>
        )}
      </div>
    </WorkspaceSection>
  );
}
