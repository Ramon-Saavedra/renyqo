"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import type { CandidateRestorationState } from "../hooks/useCandidateRestoration";
import type { ExitedApplicant, ExitedApplicantVisualState } from "../types";
import { mapApplicantToPreview } from "../utils/applicant-format";
import { ApplicantPreviewModal } from "./ApplicantPreviewModal";

export interface RecentExitsRailProps {
  exits: readonly ExitedApplicant[];
  isLoading: boolean;
  hasError: boolean;
  restorationState: CandidateRestorationState;
  onRestore: (applicationId: string) => Promise<boolean>;
  onResetRestoration: () => void;
}

const HEAD_CLASS =
  "font-mono text-meta font-medium uppercase tracking-wide text-foreground-tertiary";
const ROW_CLASS =
  "mt-3.5 flex flex-col gap-2 @min-[640px]:flex-row @min-[640px]:flex-wrap @min-[640px]:items-center @min-[640px]:gap-3.5";
const CHIP_CLASS =
  "flex min-w-0 max-w-full flex-col gap-1 rounded-md py-2 pr-1.5 pl-3 @min-[640px]:w-auto";
const CHIP_VARIANT_CLASS: Record<ExitedApplicantVisualState, string> = {
  withdrawn: "bg-exit-withdrawn-bg",
  provider_discarded: "bg-exit-provider-discarded-bg",
  system_removed: "bg-background-subtle",
};
const CHIP_REASON_CLASS: Record<ExitedApplicantVisualState, string> = {
  withdrawn: "text-exit-withdrawn-fg",
  provider_discarded: "text-exit-provider-discarded-fg",
  system_removed: "text-foreground-tertiary",
};

function renderLoadingSlots() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div
      key={`recent-exits-loading-${index}`}
      className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-md bg-background-subtle py-1 pr-1 pl-3"
    >
      <RenyqoSkeleton height={13} className="w-20" />
    </div>
  ));
}

export function RecentExitsRail({
  exits,
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
  const [previewExit, setPreviewExit] = useState<ExitedApplicant | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const isRestoring = restorationState.status === "submitting";
  const isEmpty = !isLoading && !hasError && exits.length === 0;

  if (isEmpty) return null;

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

  return (
    <>
      <section
        aria-label={copy.title}
        ref={panelRef}
        tabIndex={-1}
        className="mt-10"
      >
        <h2 className={HEAD_CLASS}>{copy.title}</h2>
        <p className="mt-1.5 max-w-md text-caption text-foreground-secondary">
          {copy.helper}
        </p>

        {hasError ? (
          <p className="mt-3 text-caption text-foreground-tertiary">
            {copy.loadError}
          </p>
        ) : null}

        {successMessage ? (
          <p role="status" aria-live="polite" className="sr-only">
            {successMessage}
          </p>
        ) : null}

        {!hasError || exits.length > 0 ? (
          <div className={ROW_CLASS}>
            {isLoading
              ? renderLoadingSlots()
              : exits.map((exit) => (
                  <span
                    key={exit.id}
                    className={`${CHIP_CLASS} ${CHIP_VARIANT_CLASS[exit.visualState]}`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 truncate text-caption text-foreground">
                        {exit.applicantName}
                      </span>
                      <span
                        className={`shrink-0 whitespace-nowrap font-mono text-meta ${CHIP_REASON_CLASS[exit.visualState]}`}
                      >
                        {copy.reasonLabel[exit.visualState]}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center pl-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPreviewExit(exit)}
                          aria-label={copy.viewAction(exit.applicantName)}
                          title={copy.viewLabel}
                        >
                          <AppIcon
                            icon={Eye}
                            size={15}
                            strokeWidth={1.8}
                            decorative
                          />
                        </Button>
                        {exit.visualState === "provider_discarded" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={copy.restoreAction(exit.applicantName)}
                            title={copy.restoreLabel}
                            disabled={isRestoring}
                            onClick={() => openRestoreConfirmation(exit)}
                            className="text-success"
                          >
                            <AppIcon
                              icon={Redo2}
                              size={15}
                              strokeWidth={1.8}
                              decorative
                            />
                          </Button>
                        ) : null}
                      </span>
                    </span>
                    {exit.activeAtLabel ? (
                      <span className="flex items-center gap-1.5 pl-px font-mono text-meta text-success">
                        <AppIcon
                          icon={ArrowRight}
                          size={12}
                          strokeWidth={1.8}
                          decorative
                          className="shrink-0"
                        />
                        {exit.activeAtLabel}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5 pl-px font-mono text-meta text-danger">
                      <AppIcon
                        icon={ArrowLeft}
                        size={12}
                        strokeWidth={1.8}
                        decorative
                        className="shrink-0"
                      />
                      {exit.exitedAtDateLabel}
                    </span>
                  </span>
                ))}
          </div>
        ) : null}
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
      <ApplicantPreviewModal
        applicant={previewExit ? mapApplicantToPreview(previewExit) : null}
        onClose={() => setPreviewExit(null)}
      />
    </>
  );
}
