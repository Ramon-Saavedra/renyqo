"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  presentNextSteps,
  toNextStepItem,
  type NextStepItem,
  type WorkspaceArea,
} from "../../model/pending-actions";
import { useViewingSnapshot } from "@/features/viewing-workflow/snapshot/use-viewing-snapshot";
import { readDeepLink } from "@/lib/navigation/deep-link";
import { useCompactViewport } from "@/lib/viewport/use-compact-viewport";
import { useDeepLinkActivity } from "@/lib/navigation/deep-link-activity";
import { focusDeepLink } from "@/lib/navigation/deep-link-focus";
import { useUrlSearch } from "@/lib/navigation/url-search";
import { displayedViewing, findViewing } from "../../model/viewing";
import { ApplicantViewing } from "./ApplicantViewing";
import { ApplicationStatePanel } from "./ApplicationStatePanel";
import { DocumentsSection } from "./DocumentsSection";
import { HistorySection } from "./HistorySection";
import { MessagesEntry, MessagesSection } from "./MessagesSection";
import { CalmNextStep, NextStepPanel } from "./NextStepPanel";
import { WithdrawSection } from "./WithdrawSection";
import { WorkspaceHeader } from "./WorkspaceHeader";

function currentNextSteps(
  items: readonly NextStepItem[],
): readonly NextStepItem[] {
  return items.map((item) => {
    if (item.intent.kind === "answer-interest") {
      return {
        ...item,
        cta: applicationsCopy.nextStep.viewing.cta,
        intent: { kind: "show-viewing" },
      };
    }
    if (item.intent.kind === "show-viewing") {
      return {
        ...item,
        text: applicationsCopy.nextStep.viewing.fallbackText,
      };
    }
    return item;
  });
}
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
    hasMessages: workspace.conversationSummary.hasMessages,
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
  const viewingWorkflow = useViewingSnapshot(applicationId, "applicant");
  const workflowMode = viewingWorkflow.projection?.mode;
  const viewingDetail = useViewingDetail(
    applicationId,
    workflowMode === "CURRENT" || workflowMode === "EMPTY"
      ? null
      : (viewing?.viewingId ?? null),
    snapshotKey,
  );
  const viewingActions = useViewingActions(
    applicationId,
    refresh,
    acceptedGeneration,
    workspace.viewingSummary,
  );
  const history = useActivityHistory(applicationId, snapshotKey);
  const search = useUrlSearch();
  const link = useMemo(
    () => readDeepLink(new URLSearchParams(search)),
    [search],
  );
  const compact = useCompactViewport();
  const [manualChat, setManualChat] = useState(false);
  const [dismissedSearch, setDismissedSearch] = useState<string | null>(null);
  const dedicatedChat =
    compact &&
    (manualChat || (link.section === "messages" && dismissedSearch !== search));

  function openChat() {
    setDismissedSearch(null);
    setManualChat(true);
  }

  function closeChat() {
    setManualChat(false);
    if (link.section === "messages") setDismissedSearch(search);
  }

  useDeepLinkActivity(history, link.activityId, link.section);

  useEffect(() => {
    if (link.section === "messages" && dedicatedChat) return;
    if (
      !link.section &&
      !link.activityId &&
      !link.requestId &&
      !link.proposalId &&
      !link.appointmentId &&
      !link.viewingId
    ) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      focusDeepLink(link);
    });
    const timer = window.setTimeout(() => focusDeepLink(link), 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [dedicatedChat, history.expanded, history.items, history.load, link]);

  useEffect(() => {
    if (!highlight) return;
    const timer = window.setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  const nextSteps = orderNextSteps(
    presentNextSteps(
      workspace.attention.pendingActions.map((action) =>
        toNextStepItem(action, {
          workspace,
          timelines:
            timelines.state.status === "ready"
              ? timelines.state.data
              : EMPTY_TIMELINES,
        }),
      ),
    ),
    selectedStep,
  );
  const visibleSteps =
    workflowMode === "CURRENT" ? currentNextSteps(nextSteps) : nextSteps;

  const areaRef = {
    messages: messagesRef,
    documents: documentsRef,
    viewing: viewingRef,
  } as const;

  const navigate = (item: NextStepItem) => {
    setHighlight(item.area);
    if (compact && item.area === "messages") {
      openChat();
      return;
    }
    areaRef[item.area].current?.scrollIntoView?.({
      behavior: "smooth",
      block: "start",
    });
  };

  const listingTitle =
    workspace.listing.title?.trim() ||
    applicationsCopy.overview.untitledListing;

  return (
    <>
      {dedicatedChat ? (
        <MessagesSection
          presentation="dedicated"
          onClose={closeChat}
          conversation={conversation}
          summary={workspace.conversationSummary}
          highlighted={false}
          now={new Date()}
          sectionRef={messagesRef}
          composerId={composerId}
        />
      ) : null}
      <div hidden={dedicatedChat || undefined} className="flex flex-col gap-5">
        <WorkspaceHeader workspace={workspace} titleId={titleId} />
        {visibleSteps.length > 0 ? (
          <NextStepPanel
            items={visibleSteps}
            onNavigate={navigate}
            onSelect={setSelectedStep}
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
            <ApplicantViewing
              workflow={viewingWorkflow}
              onChanged={refresh}
              legacy={{
                className: "order-3 lg:order-none",
                viewing,
                detail: viewingDetail,
                status,
                actions: viewingActions,
                highlighted: highlight === "viewing",
                sectionRef: viewingRef,
              }}
            />
            <HistorySection
              className="order-4 lg:order-none"
              preview={workspace.activityPreview.items}
              history={history}
            />
          </div>
          <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5">
            {compact ? (
              <MessagesEntry
                className="order-1 lg:order-none"
                sectionRef={messagesRef}
                highlighted={highlight === "messages"}
                onOpen={openChat}
              />
            ) : (
              <MessagesSection
                className="order-1 lg:order-none"
                conversation={conversation}
                summary={workspace.conversationSummary}
                highlighted={highlight === "messages"}
                now={new Date()}
                sectionRef={messagesRef}
                composerId={composerId}
              />
            )}
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
    </>
  );
}
