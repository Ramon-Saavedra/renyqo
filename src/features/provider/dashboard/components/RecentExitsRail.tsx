"use client";

import { useRef, useState } from "react";
import {
  ArrowLeftFromLine,
  Redo2,
  UserMinus,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import type { CandidateRestorationState } from "../hooks/useCandidateRestoration";
import type { ExitedApplicant, ExitedApplicantVisualState } from "../types";

export interface RecentExitsRailProps {
  exits: readonly ExitedApplicant[];
  totalCount: number;
  isLoading: boolean;
  hasError: boolean;
  restorationState: CandidateRestorationState;
  onRestore: (applicationId: string) => Promise<boolean>;
  onResetRestoration: () => void;
}

const PANEL_CLASS =
  "rounded-md bg-background-muted px-dashboard-parent-x py-dashboard-parent-y";
const HEAD_CLASS = "mb-3 flex items-center gap-2";
const TITLE_CLASS =
  "text-meta leading-none font-medium tracking-wide text-foreground-tertiary uppercase";
const COUNT_CLASS =
  "text-caption leading-none tabular-nums text-foreground-tertiary";
const RAIL_CLASS = "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6";
const CARD_CLASS =
  "relative flex h-12 min-w-0 flex-col justify-center gap-0.5 rounded-md border px-dashboard-card-x shadow-card sm:h-13";
const MORE_CLASS =
  "flex h-12 min-w-0 items-center justify-center rounded-md bg-background px-dashboard-card-x text-caption text-foreground-tertiary sm:h-13";

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
    cardClass: "border-exit-withdrawn-fg/35 bg-exit-withdrawn-bg",
    iconClass: "text-danger",
    dateClass: "text-exit-withdrawn-fg",
    Icon: ArrowLeftFromLine,
  },
  provider_discarded: {
    cardClass:
      "border-exit-provider-discarded-fg/35 bg-exit-provider-discarded-bg",
    iconClass: "text-exit-provider-discarded-fg",
    dateClass: "text-exit-provider-discarded-muted-fg",
    Icon: UserX,
  },
  system_removed: {
    cardClass: "border-border-strong bg-background-subtle",
    iconClass: "text-foreground-tertiary",
    dateClass: "text-foreground-tertiary",
    Icon: UserMinus,
  },
};

function renderLoadingSlots() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div
      key={`recent-exits-loading-${index}`}
      className="flex h-12 min-w-0 items-center gap-2 rounded-md bg-background px-dashboard-card-x sm:h-13"
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
  restorationState,
  onRestore,
  onResetRestoration,
}: RecentExitsRailProps) {
  const copy = dashboardCopy.recentExits;
  const [exitToRestore, setExitToRestore] = useState<ExitedApplicant | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const isRestoring = restorationState.status === "submitting";

  function openRestoreConfirmation(exit: ExitedApplicant) {
    onResetRestoration();
    setSuccessMessage(null);
    setExitToRestore(exit);
  }

  function closeRestoreConfirmation() {
    if (isRestoring) return;
    onResetRestoration();
    setExitToRestore(null);
  }

  async function confirmRestoration() {
    if (!exitToRestore) return;

    const restored = await onRestore(exitToRestore.id);
    if (!restored) return;

    setExitToRestore(null);
    setSuccessMessage(copy.restoreSuccess);
  }

  const isEmpty = !isLoading && !hasError && exits.length === 0;

  const remaining = Math.max(0, totalCount - exits.length);

  return (
    <>
      <section aria-label={copy.title} ref={panelRef} tabIndex={-1}>
        <div className={PANEL_CLASS}>
          <p className="mb-1 text-caption font-semibold text-primary">
            {copy.helper}
          </p>
          <div className={HEAD_CLASS}>
            <h3 className={TITLE_CLASS}>{copy.title}</h3>
            {!isLoading && exits.length > 0 ? (
              <span className={COUNT_CLASS}>{totalCount}</span>
            ) : null}
          </div>

          {hasError ? (
            <p className="text-caption text-foreground-tertiary">
              {copy.loadError}
            </p>
          ) : null}

          {successMessage ? (
            <p role="status" aria-live="polite" className="sr-only">
              {successMessage}
            </p>
          ) : null}

          {isEmpty ? (
            <div className="flex h-12 items-center px-0.5 sm:h-13">
              <span className="text-caption text-foreground-tertiary">
                {copy.empty}
              </span>
            </div>
          ) : !hasError || exits.length > 0 ? (
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
                          {exit.visualState === "provider_discarded" ? (
                            <Button
                              type="button"
                              variant="primaryGhost"
                              size="icon-2xs"
                              aria-label={copy.restoreAction(
                                exit.applicantName,
                              )}
                              title={copy.restoreAction(exit.applicantName)}
                              disabled={isRestoring}
                              onClick={() => openRestoreConfirmation(exit)}
                              className="shrink-0"
                            >
                              <AppIcon
                                icon={Redo2}
                                size={12}
                                strokeWidth={2}
                                decorative
                                className="text-success-vivid"
                              />
                            </Button>
                          ) : null}
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
          ) : null}
        </div>
      </section>
      <ConfirmationModal
        open={exitToRestore !== null}
        title={copy.restoreTitle}
        text={copy.restoreText(exitToRestore?.applicantName ?? "")}
        primaryLabel={copy.restoreConfirm}
        primaryPendingLabel={copy.restorePending}
        primaryPending={isRestoring}
        secondaryLabel={copy.restoreCancel}
        onPrimary={() => void confirmRestoration()}
        onSecondary={closeRestoreConfirmation}
        onClose={closeRestoreConfirmation}
        closeLabel={copy.restoreCancel}
        error={restorationState.status === "error" ? copy.restoreError : null}
        icon={Redo2}
        focusFallbackRef={panelRef}
      />
    </>
  );
}
