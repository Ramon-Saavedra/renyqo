import {
  ArrowLeftFromLine,
  UserMinus,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import type { ExitedApplicant, ExitedApplicantVisualState } from "../types";

export interface RecentExitsRailProps {
  exits: readonly ExitedApplicant[];
  totalCount: number;
  isLoading: boolean;
  hasError: boolean;
}

const PANEL_CLASS = "rounded-md bg-background-muted px-4 py-parent-y sm:px-5";
const HEAD_CLASS = "mb-3 flex items-center gap-2";
const TITLE_CLASS =
  "text-meta leading-none font-medium tracking-wide text-foreground-tertiary uppercase";
const COUNT_CLASS =
  "text-caption leading-none tabular-nums text-foreground-tertiary";
const RAIL_CLASS = "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6";
const CARD_CLASS =
  "flex h-12 min-w-0 flex-col justify-center gap-0.5 rounded-md px-2.5 shadow-card sm:h-13";
const MORE_CLASS =
  "flex h-12 min-w-0 items-center justify-center rounded-md bg-background px-2 text-caption text-foreground-tertiary sm:h-13";

const VISUAL_STATE_STYLES: Record<
  ExitedApplicantVisualState,
  {
    cardClass: string;
    iconClass: string;
    dateClass: string;
    Icon: LucideIcon;
  }
> = {
  withdrawn: {
    cardClass: "bg-exit-withdrawn-bg",
    iconClass: "text-danger",
    dateClass: "text-exit-withdrawn-fg",
    Icon: ArrowLeftFromLine,
  },
  provider_discarded: {
    cardClass: "bg-exit-provider-discarded-bg",
    iconClass: "text-exit-provider-discarded-fg",
    dateClass: "text-exit-provider-discarded-muted-fg",
    Icon: UserX,
  },
  system_removed: {
    cardClass: "bg-background",
    iconClass: "text-foreground-tertiary",
    dateClass: "text-foreground-tertiary",
    Icon: UserMinus,
  },
};

function renderLoadingSlots() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div
      key={`recent-exits-loading-${index}`}
      className="flex h-12 min-w-0 items-center gap-2 rounded-md bg-background px-2.5 sm:h-13"
    >
      <RenyqoSkeleton variant="circle" width={12} height={12} />
      <RenyqoSkeleton height={11} className="w-full max-w-20" />
    </div>
  ));
}

export function RecentExitsRail({
  exits,
  totalCount,
  isLoading,
  hasError,
}: RecentExitsRailProps) {
  const copy = dashboardCopy.recentExits;
  const isEmpty = !isLoading && !hasError && exits.length === 0;

  const remaining = Math.max(0, totalCount - exits.length);

  return (
    <section aria-label={copy.title}>
      <div className={PANEL_CLASS}>
        <p className="mb-1 text-caption font-semibold text-primary">
          {copy.helper}
        </p>
        <div className={HEAD_CLASS}>
          <h3 className={TITLE_CLASS}>{copy.title}</h3>
          {!isLoading && !hasError && exits.length > 0 ? (
            <span className={COUNT_CLASS}>{totalCount}</span>
          ) : null}
        </div>

        {hasError ? (
          <p className="text-caption text-foreground-tertiary">
            {copy.loadError}
          </p>
        ) : isEmpty ? (
          <div className="flex h-12 items-center px-0.5 sm:h-13">
            <span className="text-caption text-foreground-tertiary">
              {copy.empty}
            </span>
          </div>
        ) : (
          <div className={RAIL_CLASS}>
            {isLoading
              ? renderLoadingSlots()
              : exits.map((exit) => {
                  const { cardClass, iconClass, dateClass, Icon } =
                    VISUAL_STATE_STYLES[exit.visualState];
                  return (
                    <div
                      key={exit.id}
                      title={exit.exitedAtLabel}
                      className={`${CARD_CLASS} ${cardClass}`}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <AppIcon
                          icon={Icon}
                          size={12}
                          strokeWidth={2}
                          decorative
                          className={iconClass}
                        />
                        <span className="min-w-0 truncate text-caption text-foreground">
                          {exit.applicantName}
                        </span>
                        <span className="sr-only">
                          {copy.stateLabel[exit.visualState]}
                        </span>
                      </div>
                      <span
                        className={`truncate pl-4.5 text-caption tabular-nums ${dateClass}`}
                      >
                        <span className="hidden sm:inline">
                          {exit.exitedAtLabel}
                        </span>
                        <span className="sm:hidden">
                          {exit.exitedAtLabelCompact}
                        </span>
                      </span>
                    </div>
                  );
                })}

            {!isLoading && remaining > 0 ? (
              <span className={MORE_CLASS}>{copy.more(remaining)}</span>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
