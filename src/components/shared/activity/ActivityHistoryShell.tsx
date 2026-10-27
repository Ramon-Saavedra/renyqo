import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

export interface ActivityHistorySummary {
  readonly label: string;
  readonly time: string;
}

interface ActivityHistoryShellProps {
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly summary: ActivityHistorySummary | null;
  readonly framed?: boolean;
  readonly className?: string | undefined;
  readonly children?: ReactNode;
  readonly status?: ReactNode;
  readonly footer?: ReactNode;
}

const TITLE = "Verlauf";
const EMPTY_COLLAPSED = "Keine Einträge";
const EMPTY_EXPANDED = "Noch keine Einträge.";

export function ActivityHistoryShell({
  expanded,
  onToggle,
  summary,
  framed = true,
  className,
  children,
  status,
  footer,
}: ActivityHistoryShellProps) {
  return (
    <section
      data-section="activity"
      aria-label={TITLE}
      className={cn(
        "scroll-mt-app-topbar",
        framed
          ? "min-w-0 overflow-hidden rounded-md border border-border bg-background-muted"
          : "flex flex-col",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-caption focus-visible:shadow-focus focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="font-display font-semibold text-foreground">
            {TITLE}
          </span>
          <span className="text-foreground-secondary">
            {summary
              ? ` · Letzter Eintrag: ${summary.label}${summary.time ? ` · ${summary.time}` : ""}`
              : ` · ${EMPTY_COLLAPSED}`}
          </span>
        </span>
        <AppIcon
          icon={expanded ? ChevronDown : ChevronRight}
          size={16}
          strokeWidth={2}
          className="text-foreground-tertiary"
          decorative
        />
      </button>
      {expanded ? (
        <div className={framed ? "border-t border-border" : undefined}>
          {summary ? (
            children
          ) : (
            <p className="px-3.5 py-3 text-caption text-foreground-secondary">
              {EMPTY_EXPANDED}
            </p>
          )}
          {status}
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function ActivityHistoryList({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <ol className="flex flex-col px-3.5 py-1">{children}</ol>;
}

export function ActivityHistoryRow({
  id,
  label,
  time,
  dateTime,
}: {
  readonly id: string;
  readonly label: string;
  readonly time: string;
  readonly dateTime: string;
}) {
  return (
    <li
      data-activity-id={id}
      className="flex items-baseline gap-2.5 py-1.25 text-caption"
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-border-strong"
      />
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
      <time
        dateTime={dateTime}
        className="whitespace-nowrap tabular-nums text-foreground-secondary"
      >
        {time}
      </time>
    </li>
  );
}
