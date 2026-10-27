import { useId, useState, type Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Lock, MessageSquare } from "lucide-react";
import { Conversation } from "@/components/shared/conversation/Conversation";
import { MobileChatView } from "@/components/shared/conversation/MobileChatView";
import type {
  ConversationEntry,
  ConversationLoadState,
} from "@/components/shared/conversation/types";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { MAX_MESSAGE_LENGTH } from "../../api/conversation";
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
  repliesDisabled: {
    icon: Lock,
    title: copy.notices.repliesDisabled.title,
    text: copy.notices.repliesDisabled.text,
  },
  closed: {
    icon: Lock,
    title: copy.notices.closed.title,
    text: copy.notices.closed.text,
  },
};

interface MessagesSectionSharedProps {
  readonly conversation: ConversationController;
  readonly summary: ApplicantWorkspace["conversationSummary"];
  readonly highlighted: boolean;
  readonly now: Date;
  readonly sectionRef: Ref<HTMLElement>;
  readonly composerId: string;
  readonly className?: string | undefined;
}

type MessagesSectionProps =
  | (MessagesSectionSharedProps & { readonly presentation?: "inline" })
  | (MessagesSectionSharedProps & {
      readonly presentation: "dedicated";
      readonly onClose: () => void;
    });

export function MessagesEntry({
  onOpen,
  highlighted = false,
  className,
  sectionRef,
}: {
  readonly onOpen: () => void;
  readonly highlighted?: boolean;
  readonly className?: string | undefined;
  readonly sectionRef?: Ref<HTMLElement>;
}) {
  const titleId = useId();
  return (
    <section
      ref={sectionRef}
      data-section="messages"
      aria-labelledby={titleId}
      className={cn(
        "min-w-0 overflow-hidden rounded-md border bg-background-muted",
        highlighted ? "border-primary" : "border-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={copy.open}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-3.5 text-left focus-visible:shadow-focus focus-visible:outline-none"
      >
        <AppIcon
          icon={MessageSquare}
          size={17}
          strokeWidth={1.9}
          className="text-foreground-secondary"
          decorative
        />
        <span
          id={titleId}
          className="min-w-0 flex-1 font-display text-lead font-semibold text-foreground"
        >
          {copy.title}
        </span>
        <AppIcon
          icon={ChevronRight}
          size={16}
          strokeWidth={2}
          className="text-foreground-tertiary"
          decorative
        />
      </button>
    </section>
  );
}

export function MessagesSection(props: MessagesSectionProps) {
  const {
    conversation,
    summary,
    highlighted,
    now,
    sectionRef,
    composerId,
    className,
  } = props;
  const dedicated = props.presentation === "dedicated";
  const [draft, setDraft] = useState("");
  const capabilities = conversation.capabilities;
  const currentSummary = capabilities ?? summary;
  const canSend = capabilities?.canCurrentUserSend === true;
  const notice = NOTICE[conversationNotice(currentSummary)];
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

  const readOnly =
    currentSummary.sendBlockReason !== null ? (
      <span className="inline-flex items-center gap-1.5 text-caption text-foreground-secondary">
        <AppIcon icon={Lock} size={13} decorative />
        {copy.readOnly}
      </span>
    ) : null;
  const conversationView = (
    <Conversation
      className={dedicated ? "min-h-0 flex-1" : "h-96"}
      scrollMode="contained"
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
      {...(dedicated ? {} : { headerLabel: copy.provider })}
    />
  );

  if (dedicated) {
    return (
      <MobileChatView
        title={copy.provider}
        closeLabel={copy.closeChat}
        onClose={props.onClose}
        section="messages"
        {...(readOnly ? { status: readOnly } : {})}
      >
        {conversationView}
      </MobileChatView>
    );
  }

  return (
    <WorkspaceSection
      icon={MessageSquare}
      title={copy.title}
      sectionKey="messages"
      highlighted={highlighted}
      sectionRef={sectionRef}
      className={className}
      aside={readOnly}
    >
      {conversationView}
    </WorkspaceSection>
  );
}
