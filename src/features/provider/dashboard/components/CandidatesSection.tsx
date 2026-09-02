"use client";

import { FormAlert } from "@/components/ui/form/FormAlert";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { Candidate, DashboardObject, WaitingCountState } from "../types";
import { CandidateLane } from "./CandidateLane";
import { useColorScheme } from "./candidate-lane-hooks";

interface CandidatesSectionProps {
  object: DashboardObject | null;
  candidates: readonly Candidate[];
  waitingCountState: WaitingCountState;
  isLoading: boolean;
  hasError: boolean;
}

const PANEL_CLASS =
  "rounded-md bg-background-muted px-dashboard-parent-x py-dashboard-parent-y";
const HEAD_CLASS = "mb-4 flex flex-col gap-1.5";
const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";
const LEAD_CLASS = "max-w-md text-caption text-foreground-tertiary";

const DRAFT_CLASS =
  "rounded-md border border-dashed border-border-strong bg-background-muted px-dashboard-card-x py-12 text-center text-caption text-foreground-secondary";

const LOADING_LANE_CLASS = "flex flex-col gap-2 lg:flex-row";
const SKELETON_SLOT_CLASS =
  "flex h-16 min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-background-muted px-dashboard-card-x py-dashboard-card-y";

function renderLoadingSlots() {
  return Array.from({ length: MAX_ACTIVE_APPLICATIONS }).map((_, index) => (
    <div key={`loading-${index}`} className={SKELETON_SLOT_CLASS}>
      <RenyqoSkeleton variant="circle" width={32} height={32} />
      <div className="flex h-9 min-w-0 flex-1 flex-col justify-center gap-1">
        <RenyqoSkeleton height={12} className="w-full max-w-32" />
        <RenyqoSkeleton height={11} className="w-full max-w-24" />
      </div>
    </div>
  ));
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
  const { candidates: copy, waitingQueue: waitingCopy } = dashboardCopy;
  const colorScheme = useColorScheme();
  const shown = object ? candidates.slice(0, MAX_ACTIVE_APPLICATIONS) : [];

  if (object?.status === "draft") {
    return (
      <section id="bewerbungen">
        <div className={PANEL_CLASS}>
          <div className={HEAD_CLASS}>
            <h3 className={TITLE_CLASS}>{copy.title}</h3>
            <p className={LEAD_CLASS}>{copy.lead}</p>
          </div>
          <p className={DRAFT_CLASS}>{copy.draftEmpty}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="bewerbungen" className="pb-6">
        <div className={PANEL_CLASS}>
          <div className={HEAD_CLASS}>
            <h3 className={TITLE_CLASS}>{copy.title}</h3>
            <p className={LEAD_CLASS}>{copy.lead}</p>
          </div>
          <div className={LOADING_LANE_CLASS}>{renderLoadingSlots()}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="bewerbungen" className="pb-6">
      {hasError ? (
        <FormAlert variant="error" message={copy.loadError} className="mb-3" />
      ) : null}
      {waitingCountState.status === "error" ? (
        <p
          role="status"
          aria-label={waitingCopy.loadError}
          aria-live="polite"
          className="mb-3 text-caption text-foreground-tertiary"
        >
          {waitingCopy.loadError}
        </p>
      ) : null}
      <CandidateLane
        actives={shown}
        waitingCount={
          waitingCountState.status === "success" ? waitingCountState.count : 0
        }
        announceWaitingStatus={waitingCountState.status !== "error"}
        capacity={MAX_ACTIVE_APPLICATIONS}
        theme={colorScheme}
      />
    </section>
  );
}
