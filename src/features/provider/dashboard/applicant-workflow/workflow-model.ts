import { formatArea } from "@/features/provider/listings-overview/utils/format";
import { formatWorkflowTimestamp } from "./format-timestamp";
import type { ListingStatus } from "@/features/provider/listings-overview/types";
import {
  buildInitials,
  formatActiveAtLabel,
  formatHousehold,
} from "../utils/applicant-format";
import type {
  ApplicantWorkspace,
  ProviderPendingAction,
} from "./api/workspace";
import { formatActivityEntry } from "./activity-label";
import { applicantWorkflowCopy } from "./copy";
import { documentTypeLabel } from "./document-labels";
import type {
  WorkflowSectionKey,
  WorkflowSectionSummary,
} from "./section-summary";

export type { WorkflowSectionKey } from "./section-summary";

export interface WorkflowListingContext {
  readonly id: string;
  readonly title: string;
  readonly city: string;
  readonly coldRent: number;
  readonly status: ListingStatus;
  readonly rooms: string;
  readonly livingArea: number;
}

export interface WorkflowApplicant {
  readonly name: string;
  readonly initials: string;
  readonly household: string;
  readonly introduction: string | null;
  readonly activeSinceLabel: string | null;
}

export interface WorkflowListing {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
}

export type WorkflowNextStep =
  | {
      readonly kind: "clear";
      readonly eyebrow: string;
      readonly title: string;
      readonly text: string;
    }
  | {
      readonly kind: "pending";
      readonly eyebrow: string;
      readonly title: string;
      readonly text: string;
    };

export interface WorkflowActivityEntry {
  readonly id: string;
  readonly actorLabel: string;
  readonly text: string;
  readonly dateLabel: string;
}

export interface WorkflowDocumentRow {
  readonly requestId: string;
  readonly documentId: string | null;
  readonly type: string;
  readonly customLabel: string | null;
  readonly label: string;
  readonly statusLabel: string;
  readonly canDownload: boolean;
  readonly canReview: boolean;
  readonly canCancel: boolean;
  readonly canRequestReplacement: boolean;
}

export interface WorkflowViewingCard {
  readonly viewingId: string;
  readonly statusLabel: string;
  readonly whenLabel: string;
  readonly interestLabel: string | null;
  readonly canReschedule: boolean;
  readonly canCancel: boolean;
  readonly canMarkCompleted: boolean;
  readonly canMarkNoShow: boolean;
}

export interface ApplicantWorkflowModel {
  readonly applicationId: string;
  readonly applicant: WorkflowApplicant;
  readonly listing: WorkflowListing;
  readonly nextStep: WorkflowNextStep;
  readonly summaries: Record<WorkflowSectionKey, WorkflowSectionSummary>;
  readonly activity: readonly WorkflowActivityEntry[];
  readonly activityPreview: ApplicantWorkspace["activityPreview"]["items"];
  readonly activityHasMore: boolean;
  readonly canReject: boolean;
  readonly canSelectForRental: boolean;
  readonly canSend: boolean;
  readonly canRequestDocuments: boolean;
  readonly canProposeViewing: boolean;
  readonly conversationOpen: boolean;
  readonly expectedResponder: "PROVIDER" | "APPLICANT" | null;
  readonly conversationReadOnly: boolean;
  readonly documents: readonly WorkflowDocumentRow[];
  readonly viewing: WorkflowViewingCard | null;
}

const PENDING_LABEL: Record<ProviderPendingAction, string> = {
  RESPOND_TO_MESSAGE: "Nachricht beantworten",
  REVIEW_DOCUMENT: "Unterlage prüfen",
  RESPOND_TO_VIEWING_CHANGE_REQUEST: "Terminänderung beantworten",
  CLOSE_UNANSWERED_VIEWING: "Offenen Termin schließen",
  RECORD_VIEWING_OUTCOME: "Besichtigungsergebnis festhalten",
};

const DOCUMENT_STATUS_LABEL = {
  UPLOAD_REQUIRED: "Ausstehend",
  PROCESSING: "Wird verarbeitet",
  RECEIVED: "Hochgeladen",
  REVIEWED: "Erhalten",
} as const;

const VIEWING_STATUS_LABEL: Record<string, string> = {
  PROPOSED: "Vorgeschlagen",
  ACCEPTED: "Angenommen",
  DECLINED: "Abgelehnt",
  CHANGE_REQUESTED: "Änderung angefragt",
  COMPLETED: "Durchgeführt",
  NO_SHOW: "Nicht erschienen",
  CANCELLED: "Abgesagt",
  SUPERSEDED: "Ersetzt",
};

const INTEREST_LABEL: Record<string, string> = {
  STILL_INTERESTED: "Weiterhin interessiert",
  NOT_INTERESTED: "Nicht mehr interessiert",
};

const ACTOR_LABEL = {
  PROVIDER: "Anbieter",
  APPLICANT: "Bewerber",
  SYSTEM: "System",
} as const;

function summary(
  key: WorkflowSectionKey,
  value: string,
  state: string,
  tone: WorkflowSectionSummary["tone"],
): WorkflowSectionSummary {
  return {
    key,
    label: applicantWorkflowCopy.summary[key].label,
    value,
    state,
    tone,
  };
}

function documentLabel(type: string, customLabel: string | null): string {
  return documentTypeLabel(type, customLabel);
}

function viewingStatusLabel(status: string): string {
  return VIEWING_STATUS_LABEL[status] ?? "Termin";
}

const VIEWING_CLOCK = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Berlin",
});

function formatWhen(startsAt: string, endsAt: string): string {
  const startLabel = formatWorkflowTimestamp(startsAt);
  const end = new Date(endsAt);
  if (!startLabel || Number.isNaN(end.getTime())) return startLabel;
  return `${startLabel}–${VIEWING_CLOCK.format(end)}`;
}

function documentCountPhrase(count: number, label: string): string {
  return `${count} ${label}`;
}

function documentSummaryCopy(workspace: ApplicantWorkspace): {
  readonly value: string;
  readonly state: string;
  readonly tone: WorkflowSectionSummary["tone"];
} {
  const documents = workspace.documentsSummary;
  const { counts } = documents;
  const parts: string[] = [];
  if (counts.reviewRequiredCount > 0) {
    parts.push(documentCountPhrase(counts.reviewRequiredCount, "zu prüfen"));
  }
  if (counts.uploadRequiredCount > 0) {
    parts.push(documentCountPhrase(counts.uploadRequiredCount, "ausstehend"));
  }
  if (counts.processingCount === 1) {
    parts.push("1 wird verarbeitet");
  } else if (counts.processingCount > 1) {
    parts.push(
      documentCountPhrase(counts.processingCount, "werden verarbeitet"),
    );
  }
  if (counts.reviewedCount > 0) {
    parts.push(documentCountPhrase(counts.reviewedCount, "geprüft"));
  }
  if (parts.length > 0) {
    return {
      value: parts.slice(0, 2).join(" · "),
      state: "",
      tone: counts.reviewRequiredCount > 0 ? "primary" : "neutral",
    };
  }
  const requestCount = documents.currentRequests.length;
  return {
    value:
      requestCount === 0
        ? "Keine Unterlagen"
        : `${requestCount} ${requestCount === 1 ? "Anfrage" : "Anfragen"}`,
    state: documents.canRequestDocuments
      ? "Anforderung möglich"
      : "Keine neue Anforderung",
    tone: "neutral",
  };
}

function viewingSummaryCopy(workspace: ApplicantWorkspace): {
  readonly value: string;
  readonly state: string;
} {
  const current = workspace.viewingSummary.current;
  if (!current) {
    return {
      value: "Kein Termin",
      state: workspace.viewingSummary.canPropose
        ? "Vorschlag möglich"
        : "Kein Vorschlag möglich",
    };
  }
  const when = formatWhen(current.startsAt, current.endsAt);
  if (current.status === "PROPOSED") {
    return {
      value: viewingStatusLabel(current.status),
      state: when || "Wartet auf Antwort",
    };
  }
  return {
    value: viewingStatusLabel(current.status),
    state: when || viewingStatusLabel(current.status),
  };
}

function nextStep(workspace: ApplicantWorkspace): WorkflowNextStep {
  const copy = applicantWorkflowCopy.nextStep;
  if (!workspace.attention.hasPendingAction) {
    return {
      kind: "clear",
      eyebrow: copy.clearEyebrow,
      title: copy.clearTitle,
      text: "",
    };
  }
  const labels = workspace.attention.pendingActions.map(
    (action) => PENDING_LABEL[action],
  );
  return {
    kind: "pending",
    eyebrow: copy.pendingEyebrow,
    title: labels[0] ?? copy.pendingFallbackTitle,
    text: labels.length > 1 ? labels.slice(1).join(" · ") : copy.pendingText,
  };
}

export function buildApplicantWorkflowModel(
  workspace: ApplicantWorkspace,
  listing: WorkflowListingContext,
): ApplicantWorkflowModel {
  const conversation = workspace.conversationSummary;
  const requests = workspace.documentsSummary.currentRequests;
  const currentViewing = workspace.viewingSummary.current;
  const unread = workspace.attention.actionableUnreadMessageCount;
  const viewingCopy = viewingSummaryCopy(workspace);
  const documentCopy = documentSummaryCopy(workspace);

  return {
    applicationId: workspace.application.id,
    applicant: {
      name: workspace.applicant.name,
      initials: buildInitials(workspace.applicant.name),
      household: formatHousehold(workspace.applicant.peopleCount),
      introduction: workspace.applicant.introduction,
      activeSinceLabel: formatActiveAtLabel(workspace.application.activeAt),
    },
    listing: {
      id: listing.id,
      title: listing.title,
      meta: applicantWorkflowCopy.listingMeta(
        listing.rooms,
        formatArea(listing.livingArea),
      ),
    },
    nextStep: nextStep(workspace),
    summaries: {
      messages: summary(
        "messages",
        unread > 0 ? `${unread} ungelesen` : "Keine ungelesenen",
        conversation.isReadOnly
          ? "Nur lesen"
          : conversation.isOpen
            ? "Offen"
            : "Geschlossen",
        unread > 0 ? "primary" : "neutral",
      ),
      documents: summary(
        "documents",
        documentCopy.value,
        documentCopy.state,
        documentCopy.tone,
      ),
      viewing: summary(
        "viewing",
        viewingCopy.value,
        viewingCopy.state,
        currentViewing ? "primary" : "neutral",
      ),
    },
    activity: workspace.activityPreview.items.flatMap((entry) => {
      const formatted = formatActivityEntry(entry, workspace.applicant.name);
      if (!formatted) return [];
      return [
        {
          id: entry.id,
          actorLabel: ACTOR_LABEL[entry.actorType],
          text: formatted.text,
          dateLabel: formatted.dateLabel,
        },
      ];
    }),
    activityHasMore: workspace.activityPreview.hasMore,
    activityPreview: workspace.activityPreview.items,
    canReject: workspace.capabilities.canReject,
    canSelectForRental: workspace.capabilities.canSelectForRental,
    canSend: conversation.canCurrentUserSend,
    canRequestDocuments: workspace.documentsSummary.canRequestDocuments,
    canProposeViewing: workspace.viewingSummary.canPropose,
    conversationOpen: conversation.isOpen,
    expectedResponder: conversation.expectedResponder,
    conversationReadOnly: conversation.isReadOnly,
    documents: requests.map((request) => ({
      requestId: request.requestId,
      documentId: request.documentId,
      type: request.type,
      customLabel: request.customLabel,
      label: documentLabel(request.type, request.customLabel),
      statusLabel: DOCUMENT_STATUS_LABEL[request.status],
      canDownload: request.canDownload,
      canReview: request.canReview,
      canCancel: request.canCancel,
      canRequestReplacement: request.canRequestReplacement,
    })),
    viewing: currentViewing
      ? {
          viewingId: currentViewing.viewingId,
          statusLabel: viewingStatusLabel(currentViewing.status),
          whenLabel: formatWhen(currentViewing.startsAt, currentViewing.endsAt),
          interestLabel: currentViewing.postViewingInterest
            ? (INTEREST_LABEL[currentViewing.postViewingInterest] ?? null)
            : null,
          canReschedule: currentViewing.capabilities.canReschedule,
          canCancel: currentViewing.capabilities.canCancel,
          canMarkCompleted: currentViewing.capabilities.canMarkCompleted,
          canMarkNoShow: currentViewing.capabilities.canMarkNoShow,
        }
      : null,
  };
}
