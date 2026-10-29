"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button/Button";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { invalidateListingApplicationData } from "@/features/applicant/listings/utils/listing-data-invalidation";
import { useRequestTabRefresh } from "../../hooks/TabRefreshProvider";
import { applicantWorkflowCopy } from "../copy";
import { useApplicantWorkspace } from "../hooks/useApplicantWorkspace";
import { useCompactViewport } from "../hooks/useCompactViewport";
import { useWorkflowSession, WorkflowSession } from "../workflow-session";
import type { DeepLink } from "@/lib/navigation/deep-link";
import { focusDeepLink } from "@/lib/navigation/deep-link-focus";
import type { WorkflowListingContext } from "../workflow-model";
import "../style.css";
import { CompactLayout } from "./CompactLayout";
import { WideLayout } from "./WideLayout";
import type { WorkflowLayoutProps } from "./WideLayout";
import { WorkspaceDismiss } from "./WorkspaceDismiss";

interface ApplicantWorkspaceViewProps {
  readonly applicationId: string;
  readonly listing: WorkflowListingContext;
  readonly onClose: () => void;
  readonly onReject: (applicantName: string) => void;
  readonly onSelected?: (() => void) | undefined;
  readonly focus?: DeepLink | null;
  readonly returnHref?: string;
}

export function ApplicantWorkspaceView({
  applicationId,
  listing,
  onClose,
  onReject,
  onSelected,
  focus = null,
  returnHref,
}: ApplicantWorkspaceViewProps) {
  const compact = useCompactViewport();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { state, reload } = useApplicantWorkspace(applicationId);
  const requestTabRefresh = useRequestTabRefresh();
  const reloadWorkspace = useCallback(() => {
    reload();
    invalidateListingApplicationData();
    requestTabRefresh();
  }, [reload, requestTabRefresh]);
  const ready = state.status === "ready" ? state.workspace : null;
  const statusMessage =
    state.status === "loading"
      ? applicantWorkflowCopy.loading
      : state.status === "inaccessible"
        ? applicantWorkflowCopy.unavailableApplication
        : state.status === "error"
          ? state.reason === "contract"
            ? applicantWorkflowCopy.contractError
            : applicantWorkflowCopy.loadError
          : null;

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      aria-describedby={
        ready?.applicant.introduction ? descriptionId : undefined
      }
      aria-busy={state.status === "loading"}
      className="flex flex-col"
    >
      {ready ? (
        <WorkflowSession
          workspace={ready}
          listing={listing}
          reloadWorkspace={reloadWorkspace}
          onSelected={onSelected}
        >
          <LoadedWorkflow
            compact={compact}
            titleId={titleId}
            descriptionId={descriptionId}
            closeButtonRef={closeButtonRef}
            onClose={onClose}
            onReject={onReject}
            focus={focus}
            {...(returnHref ? { returnHref } : {})}
          />
        </WorkflowSession>
      ) : (
        <WorkflowStatus
          compact={compact}
          titleId={titleId}
          closeButtonRef={closeButtonRef}
          message={statusMessage ?? applicantWorkflowCopy.loadError}
          onClose={onClose}
          showSkeleton={state.status === "loading"}
          onRetry={state.status === "error" ? reload : null}
          {...(returnHref ? { returnHref } : {})}
        />
      )}
    </div>
  );
}

function LoadedWorkflow({
  compact,
  focus = null,
  onReject,
  ...layoutProps
}: Omit<WorkflowLayoutProps, "model" | "onReject"> & {
  readonly compact: boolean;
  readonly onReject: (applicantName: string) => void;
}) {
  const { model } = useWorkflowSession();
  const focusActivityId = focus?.activityId ?? null;
  const [activityExpanded, setActivityExpanded] = useState(
    focusActivityId !== null,
  );
  const openedFor = useRef(focusActivityId);
  useEffect(() => {
    if (!focusActivityId || openedFor.current === focusActivityId) return;
    openedFor.current = focusActivityId;
    setActivityExpanded(true);
  }, [focusActivityId]);
  useEffect(() => {
    if (!focus) return;
    const frame = window.requestAnimationFrame(() => focusDeepLink(focus));
    const timer = window.setTimeout(() => focusDeepLink(focus), 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [focus]);
  const layout = {
    ...layoutProps,
    model,
    focus,
    activityExpanded,
    onActivityExpandedChange: setActivityExpanded,
    onReject: () => onReject(model.applicant.name),
  };
  return compact ? <CompactLayout {...layout} /> : <WideLayout {...layout} />;
}

function WorkflowStatus({
  compact,
  titleId,
  closeButtonRef,
  message,
  showSkeleton,
  onClose,
  onRetry,
  returnHref,
}: {
  readonly compact: boolean;
  readonly titleId: string;
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly message: string;
  readonly showSkeleton: boolean;
  readonly onClose: () => void;
  readonly onRetry: (() => void) | null;
  readonly returnHref?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 px-gutter">
        <WorkspaceDismiss
          compact={compact}
          onClose={onClose}
          closeButtonRef={closeButtonRef}
          {...(returnHref ? { returnHref } : {})}
        />
        <h2
          id={titleId}
          className="font-display text-lead font-semibold text-foreground"
        >
          {message}
        </h2>
        {showSkeleton ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <RenyqoSkeleton variant="circle" width={40} height={40} />
            <RenyqoSkeleton variant="text" height={16} className="w-40" />
            <RenyqoSkeleton variant="text" height={12} className="w-56" />
          </div>
        ) : null}
        {onRetry ? (
          <Button type="button" variant="primary" onClick={onRetry}>
            {applicantWorkflowCopy.retry}
          </Button>
        ) : null}
      </div>
    </>
  );
}
