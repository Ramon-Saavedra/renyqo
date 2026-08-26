"use client";

import { Plus } from "lucide-react";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { Candidate, DashboardObject, WaitingCountState } from "../types";
import { CANDIDATE_SLOT_CLASS } from "./candidate-slot-layout";
import { CandidateCard } from "./CandidateCard";
import { WaitingQueueRow } from "./WaitingQueueRow";

interface CandidatesSectionProps {
  object: DashboardObject | null;
  candidates: readonly Candidate[];
  waitingCountState: WaitingCountState;
  isLoading: boolean;
  hasError: boolean;
}

const HEAD_CLASS = "mb-4 flex flex-col gap-1.5";
const TITLE_ROW_CLASS = "flex flex-wrap items-baseline gap-x-3 gap-y-1";
const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";
const LEAD_CLASS = "max-w-md text-caption text-foreground-tertiary";
const COUNTER_CLASS = "font-mono text-caption text-foreground-tertiary";

const GRID_CLASS =
  "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
const EMPTY_CLASS = `${CANDIDATE_SLOT_CLASS} border border-dashed border-border bg-background-subtle`;
const EMPTY_ICON_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-foreground-tertiary";
const EMPTY_TEXT_CLASS = "flex min-w-0 flex-1 flex-col justify-center gap-0.5";
const EMPTY_PRIMARY_CLASS = "text-caption font-medium text-foreground-tertiary";
const EMPTY_SECONDARY_CLASS = "text-caption text-foreground-tertiary";

const DRAFT_CLASS =
  "rounded-md border border-dashed border-border-strong bg-background-subtle px-6 py-12 text-center text-caption text-foreground-secondary";

const SKELETON_CARD_CLASS = `${CANDIDATE_SLOT_CLASS} border border-border bg-background-subtle`;

function renderEmptySlots(count: number) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={`empty-${index}`} className={EMPTY_CLASS}>
      <span aria-hidden="true" className={EMPTY_ICON_CLASS}>
        <AppIcon icon={Plus} size={16} strokeWidth={1.4} decorative />
      </span>
      <span className={EMPTY_TEXT_CLASS}>
        <span className={EMPTY_PRIMARY_CLASS}>
          {dashboardCopy.candidates.emptySlotPrimary}
        </span>
        <span className={EMPTY_SECONDARY_CLASS}>
          {dashboardCopy.candidates.emptySlotSecondary}
        </span>
      </span>
    </div>
  ));
}

function renderLoadingSlots() {
  return Array.from({ length: MAX_ACTIVE_APPLICATIONS }).map((_, index) => (
    <div key={`loading-${index}`} className={SKELETON_CARD_CLASS}>
      <RenyqoSkeleton variant="circle" width={32} height={32} />
      <div className="flex h-9 min-w-0 flex-1 flex-col justify-center gap-1">
        <RenyqoSkeleton height={12} className="w-full max-w-32" />
        <RenyqoSkeleton height={11} className="w-full max-w-24" />
      </div>
    </div>
  ));
}

function renderWaitingSkeleton() {
  return (
    <div
      data-testid="waiting-queue-skeleton"
      className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background-subtle px-3 py-2 sm:min-h-11 sm:px-4"
    >
      <RenyqoSkeleton variant="circle" width={16} height={16} />
      <RenyqoSkeleton height={13} width="65%" className="max-w-full" />
    </div>
  );
}

function shouldShowWaitingRow(
  object: DashboardObject | null,
  waitingCountState: WaitingCountState,
  isLoading: boolean,
): waitingCountState is Extract<
  WaitingCountState,
  { status: "success" } | { status: "error" }
> {
  return (
    object?.status === "published" &&
    !isLoading &&
    (waitingCountState.status === "success" ||
      waitingCountState.status === "error")
  );
}

export function CandidatesSection(props: CandidatesSectionProps) {
  return (
    <CandidatesSectionContent key={props.object?.id ?? "none"} {...props} />
  );
}

function CandidatesSectionContent({
  object,
  candidates,
  waitingCountState,
  isLoading,
  hasError,
}: CandidatesSectionProps) {
  const { candidates: copy } = dashboardCopy;
  const shown = object ? candidates.slice(0, MAX_ACTIVE_APPLICATIONS) : [];
  const emptySlots = Math.max(0, MAX_ACTIVE_APPLICATIONS - shown.length);

  if (object?.status === "draft") {
    return (
      <section id="bewerbungen">
        <div className={HEAD_CLASS}>
          <div>
            <h3 className={TITLE_CLASS}>{copy.title}</h3>
            <p className={LEAD_CLASS}>{copy.lead}</p>
          </div>
        </div>
        <p className={DRAFT_CLASS}>{copy.draftEmpty}</p>
      </section>
    );
  }

  return (
    <section id="bewerbungen" className="pb-6">
      <div className={HEAD_CLASS}>
        <div className={TITLE_ROW_CLASS}>
          <h3 className={TITLE_CLASS}>{copy.title}</h3>
          {!isLoading ? (
            <span className={COUNTER_CLASS}>
              {copy.activeOccupancy(shown.length)}
            </span>
          ) : null}
        </div>
        <p className={LEAD_CLASS}>{copy.lead}</p>
      </div>

      {hasError ? (
        <FormAlert variant="error" message={copy.loadError} className="mb-3" />
      ) : null}

      <div className={GRID_CLASS}>
        {isLoading ? (
          renderLoadingSlots()
        ) : (
          <>
            {shown.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
            {renderEmptySlots(emptySlots)}
          </>
        )}
      </div>

      {isLoading ? (
        renderWaitingSkeleton()
      ) : shouldShowWaitingRow(object, waitingCountState, isLoading) ? (
        <WaitingQueueRow waitingCountState={waitingCountState} />
      ) : null}
    </section>
  );
}
