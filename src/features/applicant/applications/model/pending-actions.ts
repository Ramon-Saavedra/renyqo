import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  FileUp,
  HeartHandshake,
  MessageSquareText,
} from "lucide-react";
import type { ConversationMessage } from "../api/conversation";
import type { DocumentRequestTimeline } from "../api/documents";
import type {
  ApplicantPendingAction,
  ApplicantWorkspace,
} from "../api/workspace";
import { applicationsCopy } from "../copy";
import { documentLabel } from "./document-labels";
import { formatDate, formatTime, formatWeekdayDate } from "./format-date";
import { findViewing } from "./viewing";

const copy = applicationsCopy.nextStep;

export type WorkspaceArea = "messages" | "documents" | "viewing";

export type NextStepIntent =
  | { readonly kind: "focus-composer" }
  | { readonly kind: "upload"; readonly requestId: string }
  | { readonly kind: "show-viewing" }
  | { readonly kind: "answer-interest"; readonly viewingId: string };

export interface NextStepItem {
  readonly key: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly text: string;
  readonly cta: string;
  readonly area: WorkspaceArea;
  readonly intent: NextStepIntent;
}

function pendingActionKey(action: ApplicantPendingAction): string {
  switch (action.type) {
    case "RESPOND_TO_MESSAGE":
      return action.type;
    case "UPLOAD_REQUESTED_DOCUMENT":
      return `${action.type}:${action.target.requestId}`;
    default:
      return `${action.type}:${action.target.viewingId}`;
  }
}

interface NextStepContext {
  readonly workspace: ApplicantWorkspace;
  readonly messages: readonly ConversationMessage[];
  readonly timelines: ReadonlyMap<string, DocumentRequestTimeline>;
}

function lastProviderMessage(
  messages: readonly ConversationMessage[],
): ConversationMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.senderType === "PROVIDER") return message;
  }
  return null;
}

export function toNextStepItem(
  action: ApplicantPendingAction,
  context: NextStepContext,
): NextStepItem {
  const key = pendingActionKey(action);
  switch (action.type) {
    case "RESPOND_TO_MESSAGE": {
      const last = lastProviderMessage(context.messages);
      return {
        key,
        icon: MessageSquareText,
        title: copy.message.title,
        text: last
          ? copy.message.text(
              formatDate(last.createdAt),
              formatTime(last.createdAt),
            )
          : copy.message.fallbackText,
        cta: copy.message.cta,
        area: "messages",
        intent: { kind: "focus-composer" },
      };
    }
    case "UPLOAD_REQUESTED_DOCUMENT": {
      const request = context.workspace.documentsSummary.currentRequests.find(
        (item) => item.requestId === action.target.requestId,
      );
      const timeline = context.timelines.get(action.target.requestId);
      return {
        key,
        icon: FileUp,
        title: copy.upload.title(
          request
            ? documentLabel(request.type, request.customLabel)
            : copy.upload.fallbackLabel,
        ),
        text: timeline
          ? copy.upload.text(formatDate(timeline.requestedAt))
          : copy.upload.fallbackText,
        cta: copy.upload.cta,
        area: "documents",
        intent: { kind: "upload", requestId: action.target.requestId },
      };
    }
    case "RESPOND_TO_VIEWING": {
      const viewing = findViewing(
        context.workspace.viewingSummary,
        action.target.viewingId,
      );
      return {
        key,
        icon: CalendarClock,
        title: copy.viewing.title,
        text: viewing
          ? copy.viewing.text(
              formatWeekdayDate(viewing.startsAt, viewing.timeZone),
              formatTime(viewing.startsAt, viewing.timeZone),
            )
          : copy.viewing.fallbackText,
        cta: copy.viewing.cta,
        area: "viewing",
        intent: { kind: "show-viewing" },
      };
    }
    case "CONFIRM_POST_VIEWING_INTEREST": {
      const viewing = findViewing(
        context.workspace.viewingSummary,
        action.target.viewingId,
      );
      return {
        key,
        icon: HeartHandshake,
        title: copy.interest.title,
        text: viewing
          ? copy.interest.text(formatDate(viewing.startsAt, viewing.timeZone))
          : copy.interest.fallbackText,
        cta: copy.interest.cta,
        area: "viewing",
        intent: {
          kind: "answer-interest",
          viewingId: action.target.viewingId,
        },
      };
    }
  }
}

export function orderNextSteps(
  items: readonly NextStepItem[],
  selectedKey: string | null,
): readonly NextStepItem[] {
  const selected = items.find((item) => item.key === selectedKey);
  if (!selected) return items;
  return [selected, ...items.filter((item) => item.key !== selectedKey)];
}
