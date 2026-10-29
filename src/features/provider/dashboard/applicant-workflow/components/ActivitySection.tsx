import { useEffect, useState } from "react";
import { activityFocusStep } from "@/lib/navigation/deep-link";
import { focusDeepLink } from "@/lib/navigation/deep-link-focus";
import { formatCardSchedule } from "@/features/applicant/applications/model/format-date";
import { Button } from "@/components/ui/button/Button";
import {
  ActivityHistoryList,
  ActivityHistoryRow,
  ActivityHistoryShell,
  type ActivityHistorySummary,
} from "@/components/shared/activity/ActivityHistoryShell";
import type { ActivityPageItem } from "../api/activity";
import { formatActivityEntry } from "../activity-label";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";

const copy = applicantWorkflowCopy.activity;
const NO_ACTIVITY: readonly ActivityPageItem[] = [];

function latestSummary(
  items: readonly ActivityPageItem[],
  applicantName: string,
  documentRounds: ReadonlyMap<string, number> | null,
): ActivityHistorySummary | null {
  for (const item of items) {
    const requestId =
      item.type === "DOCUMENT_REQUESTED" ? item.payload?.requestId : undefined;
    const formatted = formatActivityEntry(
      item,
      applicantName,
      requestId ? documentRounds?.get(requestId) : undefined,
    );
    if (!formatted) continue;
    return {
      label: formatted.text,
      time: formatCardSchedule(item.occurredAt),
    };
  }
  return null;
}

function ActivityDisclosure({
  model,
  framed,
  focusActivityId = null,
  activityExpanded,
  onActivityExpandedChange,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly framed: boolean;
  readonly focusActivityId?: string | null;
  readonly activityExpanded?: boolean;
  readonly onActivityExpandedChange?: (expanded: boolean) => void;
}) {
  const session = useOptionalWorkflowSession();
  const activityItems = session?.activityItems ?? NO_ACTIVITY;
  const activityCursor = session?.activityCursor ?? null;
  const activityStatus = session?.activityStatus ?? "idle";
  const documentRounds = session?.documentRounds ?? null;
  const [localOpen, setLocalOpen] = useState(focusActivityId !== null);
  const open = activityExpanded ?? localOpen;
  function setOpen(next: boolean) {
    if (onActivityExpandedChange) onActivityExpandedChange(next);
    else setLocalOpen(next);
  }
  const loaded = activityItems.length > 0;
  const source = loaded ? activityItems : model.activityPreview;

  useEffect(() => {
    if (!focusActivityId || !session || !open) return;
    if (activityStatus === "loading" || activityStatus === "error") return;
    const hasMore = loaded ? activityCursor !== null : model.activityHasMore;
    const step = activityFocusStep(focusActivityId, source, hasMore);
    if (step === "found") {
      const frame = window.requestAnimationFrame(() => {
        focusDeepLink({
          listingId: null,
          applicationId: null,
          section: "activity",
          requestId: null,
          documentId: null,
          viewingId: null,
          proposalId: null,
          appointmentId: null,
          activityId: focusActivityId,
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (step !== "load") return;
    void session.showMoreActivity();
  }, [
    activityCursor,
    activityStatus,
    focusActivityId,
    loaded,
    model.activityHasMore,
    open,
    session,
    source,
  ]);

  const summary = latestSummary(
    model.activityPreview,
    model.applicant.name,
    documentRounds,
  );
  const canLoadMore =
    open &&
    activityStatus !== "error" &&
    (loaded ? activityCursor !== null : model.activityHasMore);

  return (
    <ActivityHistoryShell
      framed={framed}
      expanded={open}
      onToggle={() => {
        if (open) session?.collapseActivity();
        setOpen(!open);
      }}
      summary={summary}
      status={
        activityStatus === "error" ? (
          <p
            role="alert"
            className="px-3.5 pb-2 text-caption text-foreground-secondary"
          >
            {copy.loadError}
          </p>
        ) : null
      }
      footer={
        canLoadMore ? (
          <div className="px-2.5 pb-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activityStatus === "loading" || !session}
              onClick={() => {
                setOpen(true);
                void session?.showMoreActivity();
              }}
            >
              {copy.loadMore}
            </Button>
          </div>
        ) : null
      }
    >
      <ActivityHistoryList>
        {source.flatMap((item) => {
          const requestId =
            item.type === "DOCUMENT_REQUESTED"
              ? item.payload?.requestId
              : undefined;
          const formatted = formatActivityEntry(
            item,
            model.applicant.name,
            requestId ? documentRounds?.get(requestId) : undefined,
          );
          if (!formatted) return [];
          return [
            <ActivityHistoryRow
              key={item.id}
              id={item.id}
              label={formatted.text}
              time={formatted.dateLabel}
              dateTime={item.occurredAt}
            />,
          ];
        })}
      </ActivityHistoryList>
    </ActivityHistoryShell>
  );
}

export function ActivitySection({
  model,
  focusActivityId = null,
  activityExpanded,
  onActivityExpandedChange,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly focusActivityId?: string | null;
  readonly activityExpanded?: boolean;
  readonly onActivityExpandedChange?: (expanded: boolean) => void;
}) {
  return (
    <ActivityDisclosure
      key={focusActivityId ?? "closed"}
      model={model}
      framed
      focusActivityId={focusActivityId}
      {...(activityExpanded === undefined ? {} : { activityExpanded })}
      {...(onActivityExpandedChange ? { onActivityExpandedChange } : {})}
    />
  );
}

export function ActivityPanel({
  model,
  focusActivityId = null,
  activityExpanded,
  onActivityExpandedChange,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly focusActivityId?: string | null;
  readonly activityExpanded?: boolean;
  readonly onActivityExpandedChange?: (expanded: boolean) => void;
}) {
  return (
    <ActivityDisclosure
      key={focusActivityId ?? "closed"}
      model={model}
      framed={false}
      focusActivityId={focusActivityId}
      {...(activityExpanded === undefined ? {} : { activityExpanded })}
      {...(onActivityExpandedChange ? { onActivityExpandedChange } : {})}
    />
  );
}
