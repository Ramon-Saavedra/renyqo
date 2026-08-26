import { AlertCircle, Users } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";
import type { WaitingCountState } from "../types";

type ResolvedWaitingCountState = Extract<
  WaitingCountState,
  { status: "success" } | { status: "error" }
>;

interface WaitingQueueRowProps {
  waitingCountState: ResolvedWaitingCountState;
}

const ROW_BASE_CLASS =
  "mt-3 flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-caption sm:min-h-11 sm:px-4";
const ROW_WAITING_CLASS = `${ROW_BASE_CLASS} bg-warning-vivid font-medium text-primary-foreground`;
const ROW_NEUTRAL_CLASS = `${ROW_BASE_CLASS} border border-border bg-background-subtle text-foreground-secondary`;
const TEXT_CLASS = "min-w-0 flex-1 truncate leading-snug";

function resolveWaitingMessage(count: number): string {
  if (count === 1) return dashboardCopy.waitingBanner.singular;
  return dashboardCopy.waitingBanner.plural(count);
}

export function WaitingQueueRow({ waitingCountState }: WaitingQueueRowProps) {
  if (waitingCountState.status === "error") {
    return (
      <div className={ROW_NEUTRAL_CLASS} role="status" aria-live="polite">
        <AppIcon
          icon={AlertCircle}
          size={16}
          strokeWidth={1.8}
          decorative
          className="shrink-0 text-foreground-tertiary"
        />
        <p className={TEXT_CLASS}>{dashboardCopy.waitingBanner.loadError}</p>
      </div>
    );
  }

  if (waitingCountState.count === 0) {
    return (
      <div className={ROW_NEUTRAL_CLASS} role="status" aria-live="polite">
        <AppIcon
          icon={Users}
          size={16}
          strokeWidth={1.8}
          decorative
          className="shrink-0 text-foreground-tertiary"
        />
        <p className={TEXT_CLASS}>{dashboardCopy.waitingBanner.empty}</p>
      </div>
    );
  }

  return (
    <div className={ROW_WAITING_CLASS} role="status" aria-live="polite">
      <AppIcon
        icon={Users}
        size={16}
        strokeWidth={1.8}
        decorative
        className="shrink-0"
      />
      <p className={TEXT_CLASS}>
        {resolveWaitingMessage(waitingCountState.count)}
      </p>
    </div>
  );
}
