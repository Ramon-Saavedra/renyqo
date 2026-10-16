import type { ConversationMessage } from "../api/conversation";
import { applicationsCopy } from "../copy";
import { calendarDayKey, formatTime, relativeDayLabel } from "./format-date";

const copy = applicationsCopy.messages;

export type TimelineEntry =
  | { readonly kind: "day"; readonly key: string; readonly label: string }
  | {
      readonly kind: "message";
      readonly key: string;
      readonly own: boolean;
      readonly author: string;
      readonly time: string;
      readonly iso: string;
      readonly body: string;
    };

export function buildMessageTimeline(
  messages: readonly ConversationMessage[],
  now: Date,
): readonly TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = calendarDayKey(message.createdAt);
    if (day !== lastDay) {
      entries.push({
        kind: "day",
        key: `day-${day}`,
        label: relativeDayLabel(message.createdAt, now, copy),
      });
      lastDay = day;
    }
    const own = message.senderType === "APPLICANT";
    entries.push({
      kind: "message",
      key: message.id,
      own,
      author: own ? copy.you : copy.provider,
      time: formatTime(message.createdAt),
      iso: message.createdAt,
      body: message.body,
    });
  }
  return entries;
}

export type ConversationNotice = "repliesDisabled" | "closed";
export function conversationNotice(conversation: {
  readonly sendBlockReason:
    | "LIFECYCLE_READ_ONLY"
    | "APPLICANT_REPLIES_DISABLED"
    | null;
}): ConversationNotice {
  return conversation.sendBlockReason === "LIFECYCLE_READ_ONLY"
    ? "closed"
    : "repliesDisabled";
}
