"use client";

import { useRef, useState } from "react";
import { UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import { useCandidateRejection } from "../hooks/useCandidateRejection";
import { useRequestTabRefresh } from "../hooks/TabRefreshProvider";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { Candidate, DashboardObject, WaitingCountState } from "../types";
import { mapApplicantToPreview } from "../utils/applicant-format";
import { ApplicantPreviewModal } from "./ApplicantPreviewModal";
import { CandidateLane } from "./CandidateLane";

interface CandidatesSectionProps {
  object: DashboardObject | null;
  candidates: readonly Candidate[];
  waitingCountState: WaitingCountState;
  isLoading: boolean;
  hasError: boolean;
}

interface RejectedApplicationsState {
  readonly candidates: readonly Candidate[];
  readonly applicationIds: readonly string[];
}

const HEAD_CLASS = "flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5";
const TITLE_CLASS =
  "font-mono text-meta font-medium uppercase tracking-wide text-primary";
const LEAD_CLASS = "mt-1 max-w-md text-caption text-foreground-tertiary";

const DRAFT_CLASS = "mt-3 max-w-md text-body text-foreground-secondary";

const LOADING_GRID_CLASS =
  "mt-4 grid grid-cols-2 gap-3 @min-[640px]:grid-cols-3 @min-[1024px]:grid-cols-6";
const SKELETON_SLOT_CLASS =
  "flex min-w-0 flex-col gap-3 rounded-md bg-background-subtle px-card-x py-card-y";

function renderLoadingSlots() {
  return Array.from({ length: MAX_ACTIVE_APPLICATIONS }).map((_, index) => (
    <div key={`loading-${index}`} className={SKELETON_SLOT_CLASS}>
      <RenyqoSkeleton variant="circle" width={32} height={32} />
      <RenyqoSkeleton variant="text" height={15} className="w-24" />
      <RenyqoSkeleton variant="text" height={12} className="w-16" />
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
  const requestRefresh = useRequestTabRefresh();
  const { state, rejectCandidate, reset } = useCandidateRejection();
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(
    null,
  );
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(
    null,
  );
  const [rejectedApplications, setRejectedApplications] =
    useState<RejectedApplicationsState>({
      candidates,
      applicationIds: [],
    });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const candidateLaneRef = useRef<HTMLElement>(null);
  const rejectedApplicationIds =
    rejectedApplications.candidates === candidates
      ? rejectedApplications.applicationIds
      : [];
  const shown = object
    ? candidates
        .filter((candidate) => !rejectedApplicationIds.includes(candidate.id))
        .slice(0, MAX_ACTIVE_APPLICATIONS)
    : [];
  const isRejecting = state.status === "submitting";

  function openRejectConfirmation(candidate: Candidate) {
    reset();
    setSuccessMessage(null);
    setCandidateToReject(candidate);
  }

  function closeRejectConfirmation() {
    if (isRejecting) return;
    reset();
    setCandidateToReject(null);
  }

  async function confirmRejection() {
    if (!candidateToReject) return;

    const rejected = await rejectCandidate(candidateToReject.id);
    if (!rejected) return;

    setRejectedApplications({
      candidates,
      applicationIds: [...rejectedApplicationIds, candidateToReject.id],
    });
    setCandidateToReject(null);
    setSuccessMessage(copy.rejectSuccess);
    requestRefresh();
  }

  if (object?.status === "draft") {
    return (
      <section id="bewerbungen" className="mt-11">
        <h3 className={TITLE_CLASS}>{copy.title}</h3>
        <p className={LEAD_CLASS}>{copy.lead}</p>
        <p className={DRAFT_CLASS}>{copy.draftEmpty}</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="bewerbungen" className="mt-11" aria-busy="true">
        <h3 className={TITLE_CLASS}>{copy.title}</h3>
        <div className={LOADING_GRID_CLASS}>{renderLoadingSlots()}</div>
      </section>
    );
  }

  return (
    <>
      <section
        ref={candidateLaneRef}
        id="bewerbungen"
        tabIndex={-1}
        className="mt-11"
      >
        <div className={HEAD_CLASS}>
          <h3 className={TITLE_CLASS}>{copy.title}</h3>
          <span className="text-caption font-medium text-primary">
            {copy.slotLabel(shown.length, MAX_ACTIVE_APPLICATIONS)}
          </span>
        </div>

        {successMessage ? (
          <p role="status" aria-live="polite" className="sr-only">
            {successMessage}
          </p>
        ) : null}

        {hasError ? (
          <div role="alert" className="mt-3 max-w-md">
            <p className="mb-3 text-body text-foreground-secondary">
              {copy.loadError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              {copy.reloadAction}
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="mt-3 max-w-md text-body text-foreground-secondary">
            {copy.noApplicants}
          </p>
        ) : (
          <div className="mt-4">
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
                waitingCountState.status === "success"
                  ? waitingCountState.count
                  : 0
              }
              announceWaitingStatus={waitingCountState.status !== "error"}
              capacity={MAX_ACTIVE_APPLICATIONS}
              onOpenPreview={setPreviewCandidate}
              onRejectCandidate={openRejectConfirmation}
              rejectingApplicationId={
                state.status === "submitting" ? state.applicationId : null
              }
            />
          </div>
        )}
      </section>
      <ConfirmationModal
        open={candidateToReject !== null}
        title={copy.rejectTitle}
        text={copy.rejectText(candidateToReject?.name ?? "")}
        primaryLabel={copy.rejectConfirm}
        primaryPendingLabel={copy.rejectPending}
        primaryPending={isRejecting}
        primaryVariant="danger"
        secondaryLabel={copy.rejectCancel}
        onPrimary={() => void confirmRejection()}
        onSecondary={closeRejectConfirmation}
        onClose={closeRejectConfirmation}
        closeLabel={copy.rejectCancel}
        error={state.status === "error" ? copy.rejectError : null}
        icon={UserRoundX}
        focusFallbackRef={candidateLaneRef}
      />
      <ApplicantPreviewModal
        applicant={
          previewCandidate ? mapApplicantToPreview(previewCandidate) : null
        }
        onClose={() => setPreviewCandidate(null)}
      />
    </>
  );
}
