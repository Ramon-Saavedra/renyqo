import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";
import { WORKFLOW_SECTION_ORDER } from "../section-summary";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ActivityPanel } from "./ActivitySection";
import { ApplicantIdentity } from "./ApplicantIdentity";
import { DecisionPanel } from "./DecisionActions";
import { DocumentsPanel } from "./DocumentsSection";
import {
  DedicatedProviderChat,
  MessageComposer,
  MessagesPanel,
} from "./MessagesSection";
import { NextStepPanel } from "./NextStepPanel";
import { ToneDot } from "./StatusTag";
import { ViewingPanel, currentViewingLabel } from "./ViewingSection";
import { useViewingSnapshot } from "@/features/viewing-workflow/snapshot/use-viewing-snapshot";
import { workflowTabForDeepLink } from "../deep-link-tab";
import type { WorkflowLayoutProps } from "./WideLayout";
import { WorkspaceDismiss } from "./WorkspaceDismiss";
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
  readonly focusActivityId: string | null;
  readonly activityExpanded?: boolean;
  readonly onActivityExpandedChange?: (expanded: boolean) => void;
}

function OverviewPanel({
  model,
  onSelectTab,
  onReject,
  focusActivityId,
  activityExpanded,
  onActivityExpandedChange,
}: OverviewPanelProps) {
  const summaryId = useId();
  const workflow = useViewingSnapshot(model.applicationId, "provider");
  const currentViewing = currentViewingLabel(workflow.projection, "");

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-background-muted">
        {WORKFLOW_SECTION_ORDER.map((key) => {
          const summary = model.summaries[key];
          const viewingOverride =
            key === "viewing" && currentViewing.length > 0;
          const showState = Boolean(summary.state) && !viewingOverride;
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
                showState
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
                  {viewingOverride ? currentViewing : summary.value}
                </span>
                {showState ? (
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
      <ActivityPanel
        model={model}
        focusActivityId={focusActivityId}
        {...(activityExpanded === undefined ? {} : { activityExpanded })}
        {...(onActivityExpandedChange ? { onActivityExpandedChange } : {})}
      />
      <DecisionPanel
        onReject={onReject}
        canReject={model.canReject}
        canSelectForRental={
          model.canSelectForRental && model.listing.id.length > 0
        }
      />
    </>
  );
}

interface ActionBarProps {
  readonly tab: WorkflowTabKey;
  readonly model: ApplicantWorkflowModel;
}

function ViewingTabAction({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const workflow = useViewingSnapshot(model.applicationId, "provider");
  const mode = workflow.projection?.mode;
  if (mode === "CURRENT" || mode === "EMPTY" || model.canProposeViewing) {
    return null;
  }
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
      return <ViewingTabAction model={model} />;
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
  returnHref,
  focus = null,
  activityExpanded,
  onActivityExpandedChange,
}: WorkflowLayoutProps) {
  const idPrefix = useId();
  function selectSection(tab: WorkflowTabKey) {
    selectTab(tab);
    if (tab === "messages") return;
    document.getElementById(tabId(idPrefix, tab))?.focus();
  }
  const linkKey = `${focus?.section ?? ""}:${focus?.activityId ?? ""}:${focus?.requestId ?? ""}`;
  const linkedTab = workflowTabForDeepLink({
    section: focus?.section ?? null,
    activityId: focus?.activityId ?? null,
  });
  const [chosenTab, setChosenTab] = useState<{
    readonly key: string;
    readonly tab: WorkflowTabKey;
  } | null>(null);
  const activeTab = chosenTab?.key === linkKey ? chosenTab.tab : linkedTab;
  function selectTab(tab: WorkflowTabKey) {
    setChosenTab({ key: linkKey, tab });
  }
  const session = useOptionalWorkflowSession();
  const { applicant, listing } = model;

  useEffect(() => {
    if (activeTab === "messages") session?.ensureMessages();
  }, [activeTab, session]);

  if (activeTab === "messages") {
    return (
      <>
        <h2 id={titleId} className="sr-only">
          {applicant.name}
        </h2>
        {applicant.introduction ? (
          <p id={descriptionId} className="sr-only">
            {applicant.introduction}
          </p>
        ) : null}
        <DedicatedProviderChat
          model={model}
          onClose={() => selectTab("overview")}
        />
      </>
    );
  }

  const panels: Record<WorkflowTabKey, ReactNode> = {
    overview: (
      <OverviewPanel
        model={model}
        onSelectTab={selectSection}
        onReject={onReject}
        focusActivityId={focus?.activityId ?? null}
        {...(activityExpanded === undefined ? {} : { activityExpanded })}
        {...(onActivityExpandedChange ? { onActivityExpandedChange } : {})}
      />
    ),
    messages: <MessagesPanel model={model} />,
    documents: <DocumentsPanel model={model} />,
    viewing: <ViewingPanel model={model} />,
  };

  return (
    <div className="flex flex-col gap-3 px-gutter">
      <WorkspaceDismiss
        compact
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        {...(returnHref ? { returnHref } : {})}
      />
      <div className="flex flex-col gap-3">
        <p className="flex flex-col text-caption text-foreground-secondary">
          <span className="font-medium text-primary">
            {applicantWorkflowCopy.context}
          </span>
          {listing.title || listing.meta ? (
            <span className="text-meta normal-case tracking-normal">
              {[listing.title, listing.meta].filter(Boolean).join(" · ")}
            </span>
          ) : null}
        </p>
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
        onSelect={selectTab}
      />

      {WORKFLOW_TAB_ORDER.map((tab) => (
        <div
          key={tab}
          id={panelId(idPrefix, tab)}
          role="tabpanel"
          aria-labelledby={tabId(idPrefix, tab)}
          hidden={tab !== activeTab}
          data-section={tab}
          tabIndex={0}
          className="flex scroll-mt-app-topbar flex-col gap-3.5"
        >
          {panels[tab]}
        </div>
      ))}

      <div className="border-t border-border pt-3">
        <ActionBar tab={activeTab} model={model} />
      </div>
    </div>
  );
}
