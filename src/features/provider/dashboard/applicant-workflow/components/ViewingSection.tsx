import { Input } from "@/components/ui/form/Input";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useViewingSnapshot } from "@/features/viewing-workflow/snapshot/use-viewing-snapshot";
import type { ViewingSnapshotState } from "@/features/viewing-workflow/snapshot/owner";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ProviderCurrentViewing } from "./current-viewing/ProviderCurrentViewing";
import { StatusTag } from "./StatusTag";
import { WorkflowSection } from "./WorkflowSection";

const copy = applicantWorkflowCopy.viewing;

const SCHEDULE_INPUT_CLASS = "min-w-0 scheme-light dark:scheme-dark";

function ViewingDetails({ model }: { readonly model: ApplicantWorkflowModel }) {
  const session = useOptionalWorkflowSession();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const viewing = model.viewing;
  const canSchedule =
    model.canProposeViewing || viewing?.canReschedule === true;
  const acting = session?.acting ?? false;
  const scheduleReady = date.length > 0 && time.length > 0;

  return (
    <div className="flex flex-col gap-2.5" data-viewing-id={viewing?.viewingId}>
      {viewing ? (
        <p className="text-caption text-foreground">
          {viewing.statusLabel}
          <span className="text-foreground-secondary">
            {" "}
            · {viewing.whenLabel}
          </span>
        </p>
      ) : (
        <p className="text-caption text-foreground-secondary">{copy.empty}</p>
      )}
      {viewing?.interestLabel ? (
        <p className="text-caption text-foreground-secondary">
          {viewing.interestLabel}
        </p>
      ) : null}
      {canSchedule ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            density="compact"
            type="date"
            aria-label={copy.pickDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`${SCHEDULE_INPUT_CLASS} w-full flex-1 basis-40 sm:w-auto`}
          />
          <Input
            density="compact"
            type="time"
            aria-label={copy.pickTime}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={`${SCHEDULE_INPUT_CLASS} w-28! shrink-0`}
          />
          {session && model.canProposeViewing ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="h-8.5"
              disabled={!scheduleReady || acting}
              onClick={() => {
                void session.propose(date, time).then((result) => {
                  if (result === "done") {
                    setDate("");
                    setTime("");
                  }
                });
              }}
            >
              {session.actionArea === "viewing" && acting
                ? copy.proposePending
                : copy.propose}
            </Button>
          ) : null}
          {session && viewing?.canReschedule ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="h-8.5"
              disabled={!scheduleReady || acting}
              onClick={() => {
                void session.reschedule(date, time).then((result) => {
                  if (result === "done") {
                    setDate("");
                    setTime("");
                  }
                });
              }}
            >
              {copy.reschedule}
            </Button>
          ) : null}
        </div>
      ) : null}
      {session?.actionArea === "viewing" && session.actionError ? (
        <p role="alert" className="text-caption text-foreground-secondary">
          {session.actionError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {session && viewing?.canCancel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={acting}
            onClick={() => void session.cancelCurrentViewing()}
          >
            {copy.cancel}
          </Button>
        ) : null}
        {session && viewing?.canMarkCompleted ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={acting}
            onClick={() => void session.completeCurrentViewing()}
          >
            {copy.complete}
          </Button>
        ) : null}
        {session && viewing?.canMarkNoShow ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={acting}
            onClick={() => void session.markCurrentNoShow()}
          >
            {copy.noShow}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function currentViewingLabel(
  projection: ViewingWorkflowProjection | null,
  fallback: string,
): string {
  if (
    !projection ||
    (projection.mode !== "CURRENT" && projection.mode !== "EMPTY")
  ) {
    return fallback;
  }
  if (projection.pendingProposal?.baseAppointmentId) return "Ersatzvorschlag";
  if (projection.pendingProposal) return "Terminvorschlag";
  if (projection.confirmedAppointment) return "Bestätigt";
  return "Kein Termin";
}

function ProviderViewingBody({
  model,
  workflow,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly workflow: ViewingSnapshotState;
}) {
  const session = useOptionalWorkflowSession();
  const projection = workflow.projection;
  if (
    projection &&
    (projection.mode === "CURRENT" || projection.mode === "EMPTY")
  ) {
    return (
      <ProviderCurrentViewing
        applicationId={model.applicationId}
        projection={projection}
        refreshError={workflow.error !== null}
        onChanged={() => {
          session?.reloadWorkspace();
        }}
      />
    );
  }
  return <ViewingDetails model={model} />;
}

export function ViewingSection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const workflow = useViewingSnapshot(model.applicationId, "provider");
  return (
    <WorkflowSection
      icon={CalendarDays}
      title={copy.title}
      sectionKey="viewing"
      aside={
        <StatusTag
          tone="neutral"
          label={currentViewingLabel(
            workflow.projection,
            model.summaries.viewing.value,
          )}
        />
      }
    >
      <div className="px-3.5 py-3">
        <ProviderViewingBody model={model} workflow={workflow} />
      </div>
    </WorkflowSection>
  );
}

export function ViewingPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const workflow = useViewingSnapshot(model.applicationId, "provider");
  return (
    <div className="flex flex-col gap-3.5">
      <StatusTag
        tone="neutral"
        label={currentViewingLabel(
          workflow.projection,
          model.summaries.viewing.value,
        )}
        className="self-start"
      />
      <ProviderViewingBody model={model} workflow={workflow} />
    </div>
  );
}
