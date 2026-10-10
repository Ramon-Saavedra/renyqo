import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { ActivityItem } from "../../api/activity-schema";
import { applicationsCopy } from "../../copy";
import type { ActivityHistory } from "../../hooks/useActivityHistory";
import { toActivityEntry } from "../../model/activity-labels";
import { TONE_DOT_CLASS } from "../../model/tone";
import { WorkspaceSection } from "../WorkspaceSection";

const copy = applicationsCopy.history;

function ActivityList({ items }: { readonly items: readonly ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-3.5 sm:px-5 py-4 text-body text-foreground-secondary">
        {copy.empty}
      </p>
    );
  }
  const entries = items.map(toActivityEntry);
  return (
    <ol className="flex flex-col px-3.5 sm:px-5 pt-4 pb-1.5">
      {entries.map((entry, index) => (
        <li key={entry.id} className="flex gap-3">
          <div
            aria-hidden="true"
            className="flex shrink-0 flex-col items-center"
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                TONE_DOT_CLASS[entry.tone],
              )}
            >
              <AppIcon icon={entry.icon} size={14} decorative />
            </span>
            <span
              className={cn(
                "min-h-2.5 w-px flex-1",
                index === entries.length - 1 ? "bg-transparent" : "bg-border",
              )}
            />
          </div>
          <div className="min-w-0 pt-0.5 pb-3.5">
            <p className="text-lead text-foreground">{entry.label}</p>
            <p className="mt-px text-caption text-foreground-tertiary">
              <time dateTime={entry.occurredAt}>{entry.dateLabel}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

interface HistorySectionProps {
  readonly preview: readonly ActivityItem[];
  readonly previewHasMore: boolean;
  readonly history: ActivityHistory;
  readonly className?: string | undefined;
}

function metaLabel(
  history: ActivityHistory,
  previewCount: number,
  previewHasMore: boolean,
): string {
  if (history.expanded && history.totalCount !== null)
    return copy.count(history.totalCount);
  if (previewHasMore) return copy.latest;
  return copy.count(previewCount);
}

export function HistorySection({
  preview,
  previewHasMore,
  history,
  className,
}: HistorySectionProps) {
  const showExpanded = history.expanded && history.load !== "loading";
  const items =
    showExpanded && history.items.length > 0 ? history.items : preview;

  return (
    <WorkspaceSection
      icon={History}
      title={copy.title}
      className={className}
      aside={
        <span className="text-caption text-foreground-tertiary">
          {metaLabel(history, preview.length, previewHasMore)}
        </span>
      }
    >
      <ActivityList items={items} />
      {history.expanded && history.load === "loading" ? (
        <p
          role="status"
          className="px-3.5 sm:px-5 pb-3 text-caption text-foreground-secondary"
        >
          {copy.loading}
        </p>
      ) : null}
      {history.expanded && history.load === "error" ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 px-3.5 sm:px-5 pb-3"
        >
          <p className="text-caption text-foreground-secondary">
            {copy.loadError}
          </p>
          <Button variant="ghost" onClick={history.retry}>
            {copy.retry}
          </Button>
        </div>
      ) : null}
      {previewHasMore ? (
        <div className="flex flex-wrap gap-1 border-t border-border px-2.5 py-1.5">
          {history.expanded && history.hasMore && history.load !== "error" ? (
            <Button
              variant="primaryGhost"
              size="md"
              disabled={history.load === "loading-more"}
              onClick={history.loadMore}
            >
              {history.load === "loading-more" ? copy.loading : copy.loadMore}
            </Button>
          ) : null}
          <Button
            variant="primaryGhost"
            size="md"
            aria-expanded={history.expanded}
            onClick={history.expanded ? history.collapse : history.expand}
          >
            {history.expanded ? copy.showLess : copy.showAll}
            <AppIcon
              icon={history.expanded ? ChevronUp : ChevronDown}
              size={15}
              decorative
            />
          </Button>
        </div>
      ) : null}
    </WorkspaceSection>
  );
}
