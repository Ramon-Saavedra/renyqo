import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { StatusTag } from "./StatusTag";
import { WorkflowSection } from "./WorkflowSection";

const copy = applicantWorkflowCopy.viewing;

const SCHEDULE_INPUT_CLASS =
  "h-8.5 min-w-0 rounded-md border border-border-strong bg-input px-2.5 text-caption text-foreground outline-none scheme-light hover:border-foreground-tertiary focus:border-primary focus:shadow-focus dark:scheme-dark";

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
    <div className="flex flex-col gap-2.5">
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
          <input
            type="date"
            aria-label={copy.pickDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`${SCHEDULE_INPUT_CLASS} w-full flex-1 basis-40 sm:w-auto`}
          />
          <input
            type="time"
            aria-label={copy.pickTime}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={`${SCHEDULE_INPUT_CLASS} w-28 shrink-0`}
          />
          {session && model.canProposeViewing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
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
              variant="outline"
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
            variant="outline"
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

export function ViewingSection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <WorkflowSection
      icon={CalendarDays}
      title={copy.title}
      aside={<StatusTag tone="neutral" label={model.summaries.viewing.value} />}
    >
      <div className="px-3.5 py-3">
        <ViewingDetails model={model} />
      </div>
    </WorkflowSection>
  );
}

export function ViewingPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <StatusTag
        tone="neutral"
        label={model.summaries.viewing.value}
        className="self-start"
      />
      <ViewingDetails model={model} />
    </div>
  );
}
