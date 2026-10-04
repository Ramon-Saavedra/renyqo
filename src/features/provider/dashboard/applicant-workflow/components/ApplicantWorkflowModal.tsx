"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { cn } from "@/lib/utils/cn";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { applicantWorkflowCopy } from "../copy";
import { useApplicantWorkspace } from "../hooks/useApplicantWorkspace";
import { useCompactViewport } from "../hooks/useCompactViewport";
import { useWorkflowSession, WorkflowSession } from "../workflow-session";
import type { WorkflowListingContext } from "../workflow-model";
import "../style.css";
import { CompactLayout } from "./CompactLayout";
import { WideLayout } from "./WideLayout";
import type { WorkflowLayoutProps } from "./WideLayout";

interface ApplicantWorkflowModalProps {
  readonly applicationId: string;
  readonly listing: WorkflowListingContext;
  readonly onClose: () => void;
  readonly onReject: () => void;
  readonly onSelected?: (() => void) | undefined;
}

export function ApplicantWorkflowModal({
  applicationId,
  listing,
  onClose,
  onReject,
  onSelected,
}: ApplicantWorkflowModalProps) {
  const compact = useCompactViewport();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { state, reload } = useApplicantWorkspace(applicationId);
  const ready = state.status === "ready" ? state.workspace : null;

  useDialogFocus({
    open: true,
    dialogRef,
    initialFocusRef: closeButtonRef,
    onClose,
    lockScroll: true,
  });
  useEffect(() => {
    if (!dialogRef.current?.contains(document.activeElement)) {
      closeButtonRef.current?.focus();
    }
  }, [compact, state.status]);

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

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-50 flex justify-center",
        compact ? "bg-background" : "items-center bg-foreground/20 p-4 sm:p-8",
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          ready?.applicant.introduction ? descriptionId : undefined
        }
        aria-busy={state.status === "loading"}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex w-full flex-col overflow-hidden bg-background focus-visible:outline-none",
          compact
            ? "h-dvh"
            : "max-h-full max-w-5xl rounded-md border border-border shadow-card",
        )}
      >
        {ready ? (
          <WorkflowSession
            workspace={ready}
            listing={listing}
            reloadWorkspace={reload}
            onSelected={onSelected}
          >
            <LoadedWorkflow
              compact={compact}
              titleId={titleId}
              descriptionId={descriptionId}
              closeButtonRef={closeButtonRef}
              onClose={onClose}
              onReject={onReject}
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
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

function LoadedWorkflow({
  compact,
  ...layoutProps
}: Omit<WorkflowLayoutProps, "model"> & { readonly compact: boolean }) {
  const { model } = useWorkflowSession();
  return compact ? (
    <CompactLayout model={model} {...layoutProps} />
  ) : (
    <WideLayout model={model} {...layoutProps} />
  );
}

function WorkflowStatus({
  compact,
  titleId,
  closeButtonRef,
  message,
  showSkeleton,
  onClose,
  onRetry,
}: {
  readonly compact: boolean;
  readonly titleId: string;
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly message: string;
  readonly showSkeleton: boolean;
  readonly onClose: () => void;
  readonly onRetry: (() => void) | null;
}) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-end border-b border-border bg-background-muted p-1">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={applicantWorkflowCopy.close}
          className={buttonClassWithSize(
            "ghost",
            compact ? "icon-md" : "icon-sm",
          )}
        >
          <AppIcon
            icon={X}
            size={compact ? 20 : 16}
            strokeWidth={2}
            decorative
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
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
          <Button type="button" variant="outline" onClick={onRetry}>
            {applicantWorkflowCopy.retry}
          </Button>
        ) : null}
      </div>
    </>
  );
}
