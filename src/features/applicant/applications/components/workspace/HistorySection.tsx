import { Button } from "@/components/ui/button/Button";
import {
  ActivityHistoryList,
  ActivityHistoryRow,
  ActivityHistoryShell,
} from "@/components/shared/activity/ActivityHistoryShell";
import type { ActivityItem } from "../../api/activity-schema";
import { applicationsCopy } from "../../copy";
import type { ActivityHistory } from "../../hooks/useActivityHistory";
import { toActivityEntry } from "../../model/activity-labels";
import { formatCardSchedule } from "../../model/format-date";

const copy = applicationsCopy.history;

function rows(items: readonly ActivityItem[]) {
  return items.map((item) => {
    const entry = toActivityEntry(item);
    return (
      <ActivityHistoryRow
        key={entry.id}
        id={entry.id}
        label={entry.label}
        time={entry.dateLabel}
        dateTime={entry.occurredAt}
      />
    );
  });
}

interface HistorySectionProps {
  readonly preview: readonly ActivityItem[];
  readonly history: ActivityHistory;
  readonly className?: string | undefined;
}

export function HistorySection({
  preview,
  history,
  className,
}: HistorySectionProps) {
  const latest = preview[0];
  const summary = latest
    ? {
        label: toActivityEntry(latest).label,
        time: formatCardSchedule(latest.occurredAt),
      }
    : null;
  const visible =
    history.expanded && history.items.length > 0 ? history.items : preview;

  return (
    <ActivityHistoryShell
      className={className}
      expanded={history.expanded}
      onToggle={history.expanded ? history.collapse : history.expand}
      summary={summary}
      status={
        history.expanded && history.load === "loading" ? (
          <p
            role="status"
            className="px-3.5 pb-2 text-caption text-foreground-secondary"
          >
            {copy.loading}
          </p>
        ) : history.expanded && history.load === "error" ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-2 px-3.5 pb-2"
          >
            <p className="text-caption text-foreground-secondary">
              {copy.loadError}
            </p>
            <Button variant="ghost" size="sm" onClick={history.retry}>
              {copy.retry}
            </Button>
          </div>
        ) : null
      }
      footer={
        history.expanded && history.hasMore && history.load !== "error" ? (
          <div className="px-2.5 pb-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={history.load === "loading-more"}
              onClick={history.loadMore}
            >
              {history.load === "loading-more" ? copy.loading : copy.loadMore}
            </Button>
          </div>
        ) : null
      }
    >
      {history.expanded && visible.length > 0 ? (
        <ActivityHistoryList>{rows(visible)}</ActivityHistoryList>
      ) : null}
    </ActivityHistoryShell>
  );
}
