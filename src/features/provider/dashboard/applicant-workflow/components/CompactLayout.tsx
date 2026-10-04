import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronRight, Clock, X } from "lucide-react";
import { Button, buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import { WORKFLOW_SECTION_ORDER } from "../section-summary";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ActivityPanel } from "./ActivitySection";
import { ApplicantIdentity } from "./ApplicantIdentity";
import { DecisionPanel } from "./DecisionActions";
import { DocumentsPanel } from "./DocumentsSection";
import { MessageComposer, MessagesPanel } from "./MessagesSection";
import { NextStepPanel } from "./NextStepPanel";
import { ToneDot } from "./StatusTag";
import { ViewingPanel } from "./ViewingSection";
import type { WorkflowLayoutProps } from "./WideLayout";
import {
  WORKFLOW_TAB_ORDER,
  WorkflowTabs,
  panelId,
  tabId,
  type WorkflowTabKey,
} from "./WorkflowTabs";

interface OverviewPanelProps {
  readonly model: ApplicantWorkflowModel;
  readonly onSelectTab: (tab: WorkflowTabKey) => void;
  readonly onReject: () => void;
}

function OverviewPanel({ model, onSelectTab, onReject }: OverviewPanelProps) {
  const summaryId = useId();

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-background-muted">
        {WORKFLOW_SECTION_ORDER.map((key) => {
          const summary = model.summaries[key];
          const labelId = `${summaryId}-${key}-label`;
          const valueId = `${summaryId}-${key}-value`;
          const stateId = `${summaryId}-${key}-state`;
          const actionId = `${summaryId}-${key}-action`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTab(key)}
              aria-labelledby={
                summary.state
                  ? `${labelId} ${valueId} ${stateId} ${actionId}`
                  : `${labelId} ${valueId} ${actionId}`
              }
              className="flex min-h-14.5 cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-background-subtle focus-visible:shadow-focus focus-visible:outline-none"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  id={labelId}
                  className="text-caption text-foreground-secondary"
                >
                  {summary.label}
                </span>
                <span
                  id={valueId}
                  className="text-action font-medium text-foreground"
                >
                  {summary.value}
                </span>
                {summary.state ? (
                  <span
                    id={stateId}
                    className="flex items-center gap-1.5 text-caption text-foreground-secondary"
                  >
                    <ToneDot tone={summary.tone} />
                    {summary.state}
                  </span>
                ) : null}
              </span>
              <AppIcon
                icon={ChevronRight}
                size={16}
                strokeWidth={2}
                className="text-foreground-tertiary"
                decorative
              />
              <span id={actionId} className="sr-only">
                {applicantWorkflowCopy.openSection}
              </span>
            </button>
          );
        })}
      </div>
      <ActivityPanel model={model} />
      <DecisionPanel
        onReject={onReject}
        canReject={model.canReject}
        canSelectForRental={model.canSelectForRental}
      />
    </>
  );
}

interface ActionBarProps {
  readonly tab: WorkflowTabKey;
  readonly model: ApplicantWorkflowModel;
}

function ActionBar({ tab, model }: ActionBarProps) {
  switch (tab) {
    case "messages":
      return <MessageComposer model={model} />;
    case "documents":
      if (model.canRequestDocuments) return null;
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center"
        >
          {applicantWorkflowCopy.documents.request}
        </Button>
      );
    case "viewing":
      if (model.canProposeViewing) return null;
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center"
        >
          {applicantWorkflowCopy.viewing.propose}
        </Button>
      );
    case "overview":
      return (
        <p className="flex min-h-11.5 items-center gap-2.5 text-caption text-foreground-secondary">
          <AppIcon icon={Clock} size={16} strokeWidth={2} decorative />
          {model.nextStep.title}
        </p>
      );
  }
}

export function CompactLayout({
  model,
  titleId,
  descriptionId,
  closeButtonRef,
  onClose,
  onReject,
}: WorkflowLayoutProps) {
  const idPrefix = useId();
  function selectSection(tab: WorkflowTabKey) {
    setActiveTab(tab);
    document.getElementById(tabId(idPrefix, tab))?.focus();
  }
  const [activeTab, setActiveTab] = useState<WorkflowTabKey>("overview");
  const session = useOptionalWorkflowSession();
  const { applicant, listing } = model;

  useEffect(() => {
    if (activeTab === "messages") session?.ensureMessages();
  }, [activeTab, session]);

  const panels: Record<WorkflowTabKey, ReactNode> = {
    overview: (
      <OverviewPanel
        model={model}
        onSelectTab={selectSection}
        onReject={onReject}
      />
    ),
    messages: <MessagesPanel model={model} />,
    documents: <DocumentsPanel model={model} />,
    viewing: <ViewingPanel model={model} />,
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-background-muted p-1">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={applicantWorkflowCopy.close}
          className={buttonClassWithSize("ghost", "icon-md")}
        >
          <AppIcon icon={X} size={20} strokeWidth={2} decorative />
        </button>
        <div className="flex min-w-0 flex-1 flex-col text-center">
          <span className="text-caption font-medium text-primary">
            {applicantWorkflowCopy.context}
          </span>
          <span className="truncate text-meta text-foreground-secondary normal-case tracking-normal">
            {listing.title} · {listing.meta}
          </span>
        </div>
        <span aria-hidden="true" className="h-11 w-11 shrink-0" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 bg-background-muted px-4 pt-3 pb-3.5">
          <ApplicantIdentity
            applicant={applicant}
            titleId={titleId}
            descriptionId={descriptionId}
            density="compact"
          />
          <NextStepPanel
            nextStep={model.nextStep}
            summaries={model.summaries}
            density="compact"
          />
        </div>

        <WorkflowTabs
          idPrefix={idPrefix}
          activeTab={activeTab}
          onSelect={setActiveTab}
        />

        {WORKFLOW_TAB_ORDER.map((tab) => (
          <div
            key={tab}
            id={panelId(idPrefix, tab)}
            role="tabpanel"
            aria-labelledby={tabId(idPrefix, tab)}
            hidden={tab !== activeTab}
            tabIndex={0}
            className="flex flex-col gap-3.5 px-4 pt-3.5 pb-4.5"
          >
            {panels[tab]}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-border bg-background-muted px-4 pt-2.5 pb-5.5">
        <ActionBar tab={activeTab} model={model} />
      </div>
    </>
  );
}
