import { useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { formatActivityEntry } from "../activity-label";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ToneDot } from "./StatusTag";

const copy = applicantWorkflowCopy.activity;

function ActivityList({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const session = useOptionalWorkflowSession();
  const activityItems = session?.activityItems ?? [];
  const activityCursor = session?.activityCursor ?? null;
  const activityStatus = session?.activityStatus ?? "idle";
  const documentRounds = session?.documentRounds ?? null;
  const [collapsed, setCollapsed] = useState(false);
  const loaded = activityItems.length > 0;
  const showingFull = loaded && !collapsed;
  const source = showingFull ? activityItems : model.activityPreview;
  const noMorePages = loaded && activityCursor === null;
  const paged = source.flatMap((item) => {
    const requestId =
      item.type === "DOCUMENT_REQUESTED" ? item.payload?.requestId : undefined;
    const formatted = formatActivityEntry(
      item,
      model.applicant.name,
      requestId ? documentRounds?.get(requestId) : undefined,
    );
    if (!formatted) return [];
    return [
      {
        id: item.id,
        text: formatted.text,
        dateLabel: formatted.dateLabel,
      },
    ];
  });

  return (
    <div className="flex flex-col">
      {paged.length > 0 ? (
        <ul
          className={
            showingFull
              ? "scrollbar-slim flex max-h-40 flex-col overflow-y-auto"
              : "scrollbar-slim flex max-h-24 flex-col overflow-y-auto"
          }
        >
          {paged.map((entry) => (
            <li
              key={entry.id}
              className="flex items-baseline gap-2.5 py-1.25 text-caption"
            >
              <ToneDot tone="neutral" />
              <span className="min-w-0 flex-1 text-foreground">
                {entry.text}
              </span>
              <span className="whitespace-nowrap tabular-nums text-foreground-secondary">
                {entry.dateLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-foreground-secondary">{copy.empty}</p>
      )}
      {activityStatus === "error" ? (
        <p role="alert" className="mt-2 text-caption text-foreground-secondary">
          {copy.loadError}
        </p>
      ) : null}
      {(model.activityHasMore || activityCursor !== null) &&
      !(showingFull && noMorePages) ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={activityStatus === "loading" || !session}
            onClick={() => {
              setCollapsed(false);
              if (session && !noMorePages) void session.showMoreActivity();
            }}
          >
            {loaded ? copy.showMore : copy.showAll}
          </Button>
          {showingFull ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setCollapsed(true)}
            >
              {copy.showLess}
            </Button>
          ) : null}
        </div>
      ) : showingFull ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 self-start"
          onClick={() => setCollapsed(true)}
        >
          {copy.showLess}
        </Button>
      ) : null}
    </div>
  );
}

function ActivityDisclosure({
  model,
  framed,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly framed: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label={copy.title}
      className={
        framed
          ? "min-w-0 overflow-hidden rounded-md border border-border bg-background-muted"
          : "flex flex-col"
      }
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left focus-visible:shadow-focus focus-visible:outline-none"
      >
        {framed ? (
          <AppIcon
            icon={History}
            size={15}
            strokeWidth={2}
            className="text-primary"
            decorative
          />
        ) : null}
        <span
          className={
            framed
              ? "font-display text-action font-semibold text-foreground"
              : "font-display text-caption font-semibold text-foreground"
          }
        >
          {copy.title}
        </span>
        <span className="flex-1" />
        <AppIcon
          icon={open ? ChevronDown : ChevronRight}
          size={16}
          strokeWidth={2}
          className="text-foreground-tertiary"
          decorative
        />
      </button>
      {open ? (
        <div
          className={
            framed ? "border-t border-border px-3.5 pt-1.5 pb-2" : "px-3.5 pb-1"
          }
        >
          <ActivityList model={model} />
        </div>
      ) : null}
    </section>
  );
}

export function ActivitySection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return <ActivityDisclosure model={model} framed />;
}

export function ActivityPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return <ActivityDisclosure model={model} framed={false} />;
}
