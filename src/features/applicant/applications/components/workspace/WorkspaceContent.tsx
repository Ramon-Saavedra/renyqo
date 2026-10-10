"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ApplicantWorkspace } from "../../api/workspace";
import type { DocumentRequestTimeline } from "../../api/documents";
import { applicationsCopy } from "../../copy";
import { useActivityHistory } from "../../hooks/useActivityHistory";
import { useConversation } from "../../hooks/useConversation";
import { useDocumentTimelines } from "../../hooks/useDocumentTimelines";
import { useDocumentTransfers } from "../../hooks/useDocumentTransfers";
import { useViewingActions } from "../../hooks/useViewingActions";
import { useViewingDetail } from "../../hooks/useViewingDetail";
import { formatTime, formatWeekdayDate } from "../../model/format-date";
import {
  orderNextSteps,
  toNextStepItem,
  type NextStepItem,
  type WorkspaceArea,
} from "../../model/pending-actions";
import { displayedViewing, findViewing } from "../../model/viewing";
import { ApplicationStatePanel } from "./ApplicationStatePanel";
import { DocumentsSection } from "./DocumentsSection";
import { HistorySection } from "./HistorySection";
import { MessagesSection } from "./MessagesSection";
import { CalmNextStep, NextStepPanel } from "./NextStepPanel";
import { ViewingSection } from "./ViewingSection";
import { WithdrawSection } from "./WithdrawSection";
import { WorkspaceHeader } from "./WorkspaceHeader";

const HIGHLIGHT_MS = 1800;
const EMPTY_TIMELINES: ReadonlyMap<string, DocumentRequestTimeline> = new Map();

function calmViewingNote(workspace: ApplicantWorkspace): string | null {
  const current = workspace.viewingSummary.current;
  if (!current || current.status !== "ACCEPTED") return null;
  if (Date.parse(current.startsAt) <= Date.parse(workspace.asOf)) return null;
  return applicationsCopy.nextStep.calmViewing(
    formatWeekdayDate(current.startsAt, current.timeZone),
    formatTime(current.startsAt, current.timeZone),
  );
}

interface WorkspaceContentProps {
  readonly workspace: ApplicantWorkspace;
  readonly refresh: () => number;
  readonly acceptedGeneration: number;
}

export function WorkspaceContent({
  workspace,
  refresh,
  acceptedGeneration,
}: WorkspaceContentProps) {
  const applicationId = workspace.application.id;
  const snapshotKey = workspace.asOf;
  const status = workspace.application.status;
  const titleId = useId();
  const composerId = useId();
  const [highlight, setHighlight] = useState<WorkspaceArea | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const messagesRef = useRef<HTMLElement>(null);
  const documentsRef = useRef<HTMLElement>(null);
  const viewingRef = useRef<HTMLElement>(null);

  const conversation = useConversation({
    applicationId,
    snapshotKey,
    isOpen: workspace.conversationSummary.isOpen,
    onSent: refresh,
  });
  const requests = workspace.documentsSummary.currentRequests;
  const timelines = useDocumentTimelines(applicationId, snapshotKey, requests);
  const transfers = useDocumentTransfers(
    applicationId,
    refresh,
    acceptedGeneration,
    requests,
  );
  const viewing = displayedViewing(workspace.viewingSummary);
  const viewingDetail = useViewingDetail(
    applicationId,
    viewing?.viewingId ?? null,
    snapshotKey,
  );
  const viewingActions = useViewingActions(
    applicationId,
    refresh,
    acceptedGeneration,
    workspace.viewingSummary,
  );
  const history = useActivityHistory(applicationId, snapshotKey);

  useEffect(() => {
    if (!highlight) return;
    const timer = window.setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  const nextSteps = orderNextSteps(
    workspace.attention.pendingActions.map((action) =>
      toNextStepItem(action, {
        workspace,
        messages: conversation.messages,
        timelines:
          timelines.state.status === "ready"
            ? timelines.state.data
            : EMPTY_TIMELINES,
      }),
    ),
    selectedStep,
  );

  const areaRef = {
    messages: messagesRef,
    documents: documentsRef,
    viewing: viewingRef,
  } as const;

  const navigate = (item: NextStepItem) => {
    setHighlight(item.area);
    areaRef[item.area].current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    if (item.intent.kind === "focus-composer") {
      document.getElementById(composerId)?.focus({ preventScroll: true });
    }
    if (item.intent.kind === "upload") {
      transfers.openPicker(item.intent.requestId);
    }
  };

  const listingTitle =
    workspace.listing.title?.trim() ||
    applicationsCopy.overview.untitledListing;

  return (
    <div className="flex flex-col gap-5">
      <WorkspaceHeader workspace={workspace} titleId={titleId} />
      {nextSteps.length > 0 ? (
        <NextStepPanel
          items={nextSteps}
          onNavigate={navigate}
          onSelect={setSelectedStep}
          isUploadBlocked={transfers.isUploadBlocked}
          canUpload={transfers.canUpload}
          interest={{
            canSubmit: (viewingId) =>
              findViewing(workspace.viewingSummary, viewingId)?.capabilities
                .canSubmitInterest ?? false,
            pending: viewingActions.pending === "interest",
            failed: viewingActions.failed === "interest",
            isBlocked: viewingActions.isBlocked,
            conflict: viewingActions.conflict,
            submit: viewingActions.submitInterest,
          }}
        />
      ) : status === "ACTIVE" ? (
        <CalmNextStep extra={calmViewingNote(workspace)} />
      ) : null}
      <ApplicationStatePanel workspace={workspace} />
      <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
        <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-5">
          <MessagesSection
            className="order-1 lg:order-none"
            conversation={conversation}
            summary={workspace.conversationSummary}
            status={status}
            highlighted={highlight === "messages"}
            now={new Date()}
            sectionRef={messagesRef}
            composerId={composerId}
          />
          <HistorySection
            className="order-4 lg:order-none"
            preview={workspace.activityPreview.items}
            previewHasMore={workspace.activityPreview.hasMore}
            history={history}
          />
        </div>
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5">
          <DocumentsSection
            className="order-2 lg:order-none"
            requests={requests}
            timelines={timelines}
            status={status}
            transfers={transfers}
            bindFileInput={transfers.bindInput}
            highlighted={highlight === "documents"}
            sectionRef={documentsRef}
          />
          <ViewingSection
            className="order-3 lg:order-none"
            viewing={viewing}
            detail={viewingDetail}
            status={status}
            actions={viewingActions}
            highlighted={highlight === "viewing"}
            sectionRef={viewingRef}
          />
        </div>
      </div>
      {workspace.capabilities.canWithdraw ? (
        <WithdrawSection
          applicationId={applicationId}
          listingTitle={listingTitle}
          status={status}
          onWithdrawn={refresh}
        />
      ) : null}
    </div>
  );
}
