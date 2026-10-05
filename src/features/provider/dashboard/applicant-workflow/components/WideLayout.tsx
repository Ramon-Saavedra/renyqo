import { useEffect, type RefObject } from "react";
import { X } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ActivitySection } from "./ActivitySection";
import { ApplicantIdentity } from "./ApplicantIdentity";
import { DecisionBar } from "./DecisionActions";
import { DocumentsSection } from "./DocumentsSection";
import { MessagesSection } from "./MessagesSection";
import { NextStepPanel } from "./NextStepPanel";
import { ViewingSection } from "./ViewingSection";

export interface WorkflowLayoutProps {
  readonly model: ApplicantWorkflowModel;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly closeButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
  readonly onReject: () => void;
}

export function WideLayout({
  model,
  titleId,
  descriptionId,
  closeButtonRef,
  onClose,
  onReject,
}: WorkflowLayoutProps) {
  const session = useOptionalWorkflowSession();
  const { applicant, listing } = model;

  useEffect(() => {
    session?.ensureMessages();
  }, [session]);

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border bg-background-subtle py-2 pr-3 pl-5 text-caption text-foreground-secondary">
        <span className="font-medium text-primary">
          {applicantWorkflowCopy.context}
        </span>
        <span className="min-w-0 truncate text-foreground">
          {listing.title}
        </span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">{listing.meta}</span>
        <span className="flex-1" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={applicantWorkflowCopy.close}
          className={buttonClassWithSize("ghost", "icon-sm")}
        >
          <AppIcon icon={X} size={16} strokeWidth={2} decorative />
        </button>
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 border-b border-border bg-background-muted px-5 pt-3.5 pb-4">
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
          />
        </div>

        <div className="@container px-5 pt-4 pb-4.5">
          <div className="applicant-workflow-columns grid grid-cols-1 items-start gap-3.5">
            <div className="flex min-w-0 flex-col gap-3.5">
              <MessagesSection model={model} />
              <ActivitySection model={model} />
            </div>
            <div className="flex min-w-0 flex-col gap-3.5">
              <DocumentsSection model={model} />
              <ViewingSection model={model} />
            </div>
          </div>
        </div>
      </div>

      <DecisionBar
        onReject={onReject}
        canReject={model.canReject}
        canSelectForRental={model.canSelectForRental}
      />
    </>
  );
}
