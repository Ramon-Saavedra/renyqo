import { useEffect, type RefObject } from "react";
import { useViewingSnapshot } from "@/features/viewing-workflow/snapshot/use-viewing-snapshot";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ActivitySection } from "./ActivitySection";
import { ApplicantIdentity } from "./ApplicantIdentity";
import { DecisionBar } from "./DecisionActions";
import { DocumentsSection } from "./DocumentsSection";
import { MessagesSection } from "./MessagesSection";
import { NextStepPanel } from "./NextStepPanel";
import type { DeepLink } from "@/lib/navigation/deep-link";
import { currentViewingLabel, ViewingSection } from "./ViewingSection";
import { WorkspaceDismiss } from "./WorkspaceDismiss";

export interface WorkflowLayoutProps {
  readonly model: ApplicantWorkflowModel;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
  readonly onReject: () => void;
  readonly returnHref?: string;
  readonly focus?: DeepLink | null;
  readonly activityExpanded?: boolean;
  readonly onActivityExpandedChange?: (expanded: boolean) => void;
}

export function WideLayout({
  model,
  titleId,
  descriptionId,
  closeButtonRef,
  onClose,
  onReject,
  returnHref,
  focus = null,
  activityExpanded,
  onActivityExpandedChange,
}: WorkflowLayoutProps) {
  const session = useOptionalWorkflowSession();
  const workflow = useViewingSnapshot(model.applicationId, "provider");
  const { applicant, listing } = model;

  useEffect(() => {
    session?.ensureMessages();
  }, [session]);

  return (
    <div className="flex flex-col gap-4 px-gutter">
      <WorkspaceDismiss
        compact={false}
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        {...(returnHref ? { returnHref } : {})}
      />
      <div className="flex flex-col gap-3.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-foreground-secondary">
          <span className="font-medium text-primary">
            {applicantWorkflowCopy.context}
          </span>
          {listing.title ? (
            <span className="min-w-0 text-foreground">{listing.title}</span>
          ) : null}
          {listing.meta ? (
            <>
              {listing.title ? <span aria-hidden="true">·</span> : null}
              <span className="whitespace-nowrap">{listing.meta}</span>
            </>
          ) : null}
        </p>
        <ApplicantIdentity
          applicant={applicant}
          titleId={titleId}
          descriptionId={descriptionId}
          density="comfortable"
        />
        <NextStepPanel
          nextStep={model.nextStep}
          summaries={model.summaries}
          density="comfortable"
          viewingValue={currentViewingLabel(workflow.projection, "")}
        />
      </div>

      <div className="@container">
        <div className="applicant-workflow-columns grid grid-cols-1 items-start gap-3.5">
          <div className="flex min-w-0 flex-col gap-3.5">
            <DocumentsSection model={model} />
            <ViewingSection model={model} />
            <ActivitySection
              model={model}
              focusActivityId={focus?.activityId ?? null}
              {...(activityExpanded === undefined ? {} : { activityExpanded })}
              {...(onActivityExpandedChange
                ? { onActivityExpandedChange }
                : {})}
            />
            <DecisionBar
              onReject={onReject}
              canReject={model.canReject}
              canSelectForRental={
                model.canSelectForRental && model.listing.id.length > 0
              }
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3.5 @min-[680px]:sticky @min-[680px]:top-app-topbar">
            <MessagesSection model={model} />
          </div>
        </div>
      </div>
    </div>
  );
}
