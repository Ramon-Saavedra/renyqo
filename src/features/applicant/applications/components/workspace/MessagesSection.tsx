import { useState, type Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock, Lock, MessageSquare, MessageSquareDashed } from "lucide-react";
import { Conversation } from "@/components/shared/conversation/Conversation";
import type {
  ConversationEntry,
  ConversationLoadState,
} from "@/components/shared/conversation/types";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { MAX_MESSAGE_LENGTH } from "../../api/conversation";
import type { ApplicationStatus } from "../../api/shared-schemas";
import type { ApplicantWorkspace } from "../../api/workspace";
import { applicationsCopy } from "../../copy";
import type { ConversationController } from "../../hooks/useConversation";
import {
  buildMessageTimeline,
  conversationNotice,
  type ConversationNotice,
} from "../../model/message-timeline";
import { WorkspaceSection } from "../WorkspaceSection";

const copy = applicationsCopy.messages;

const NOTICE: Record<
  ConversationNotice,
  { readonly icon: LucideIcon; readonly title: string; readonly text: string }
> = {
  notStarted: {
    icon: MessageSquareDashed,
    title: copy.notices.notStarted.title,
    text: copy.notices.notStarted.text,
  },
  notStartedWaiting: {
    icon: MessageSquareDashed,
    title: copy.notices.notStarted.title,
    text: copy.notices.notStarted.waitingText,
  },
  notYourTurn: {
    icon: Clock,
    title: copy.notices.notYourTurn.title,
    text: copy.notices.notYourTurn.text,
  },
  closed: {
    icon: Lock,
    title: copy.notices.closed.title,
    text: copy.notices.closed.text,
  },
};

interface MessagesSectionProps {
  readonly conversation: ConversationController;
  readonly summary: ApplicantWorkspace["conversationSummary"];
  readonly status: ApplicationStatus;
  readonly highlighted: boolean;
  readonly now: Date;
  readonly sectionRef: Ref<HTMLElement>;
  readonly composerId: string;
  readonly className?: string | undefined;
}

export function MessagesSection({
  conversation,
  summary,
  status,
  highlighted,
  now,
  sectionRef,
  composerId,
  className,
}: MessagesSectionProps) {
  const [draft, setDraft] = useState("");
  const capabilities = conversation.capabilities;
  const currentSummary = capabilities
    ? { ...capabilities, isReadOnly: capabilities.expectedResponder === null }
    : summary;
  const canSend = capabilities?.canCurrentUserSend === true;
  const notice = NOTICE[conversationNotice(currentSummary, status)];
  const entries: readonly ConversationEntry[] = buildMessageTimeline(
    conversation.messages,
    now,
  ).map((entry) =>
    entry.kind === "day"
      ? entry
      : {
          kind: "message",
          key: entry.key,
          direction: entry.own ? "sent" : "received",
          author: entry.author,
          time: entry.time,
          iso: entry.iso,
          body: entry.body,
        },
  );
  const loadState: ConversationLoadState =
    conversation.load.status === "loading"
      ? { status: "loading", label: copy.loading }
      : conversation.load.status === "error"
        ? {
            status: "error",
            label: copy.loadError,
            retryLabel: copy.retry,
            onRetry: conversation.retry,
          }
        : { status: "ready" };
  const submit = () => {
    if (!canSend || conversation.sending || !draft.trim()) return;
    void conversation.send(draft).then((sent) => {
      if (sent) setDraft("");
    });
  };

  return (
    <WorkspaceSection
      icon={MessageSquare}
      title={copy.title}
      highlighted={highlighted}
      sectionRef={sectionRef}
      className={className}
      aside={
        currentSummary.isReadOnly ? (
          <span className="inline-flex items-center gap-1.5 text-caption text-foreground-secondary">
            <AppIcon icon={Lock} size={13} decorative />
            {copy.readOnly}
          </span>
        ) : capabilities?.expectedResponder === "APPLICANT" && canSend ? (
          <span className="inline-flex items-center gap-1.5 text-caption font-medium text-primary">
            <span
              aria-hidden="true"
              className="h-1.75 w-1.75 rounded-full bg-primary"
            />
            {copy.replyExpected}
          </span>
        ) : null
      }
    >
      <Conversation
        className="h-96"
        scrollMode="contained"
        headerLabel={copy.provider}
        entries={entries}
        loadState={loadState}
        emptyLabel={copy.empty}
        logLabel={copy.logLabel}
        statusMessage={conversation.readFailed ? copy.readError : null}
        notice={
          canSend ||
          conversation.load.status === "loading" ||
          conversation.load.status === "error"
            ? null
            : notice
        }
        composer={
          canSend || draft.length > 0
            ? {
                id: composerId,
                value: draft,
                onChange: setDraft,
                onSubmit: submit,
                disabled: !canSend,
                sending: conversation.sending,
                maxLength: MAX_MESSAGE_LENGTH,
                label: copy.composerLabel,
                placeholder: copy.placeholder,
                hint: copy.shortcut,
                sendLabel: copy.send,
                sendingLabel: copy.sending,
                invalid: conversation.sendFailure === "invalid",
                error: conversation.sendFailure
                  ? conversation.sendFailure === "invalid"
                    ? copy.sendInvalid
                    : conversation.sendFailure === "conflict"
                      ? copy.sendConflict
                      : copy.sendError
                  : null,
              }
            : null
        }
      />
    </WorkspaceSection>
  );
}
