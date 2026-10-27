import { useId, useState } from "react";
import { LockKeyhole, MessageSquare } from "lucide-react";
import { Conversation } from "@/components/shared/conversation/Conversation";
import { MobileChatView } from "@/components/shared/conversation/MobileChatView";
import { ConversationComposer } from "@/components/shared/conversation/ConversationComposer";
import { ConversationMessages } from "@/components/shared/conversation/ConversationMessages";
import { ConversationNotice } from "@/components/shared/conversation/ConversationNotice";
import type {
  ConversationComposerProps,
  ConversationMessagesProps,
} from "@/components/shared/conversation/types";
import { applicantWorkflowCopy } from "../copy";
import { formatWorkflowTimestamp } from "../format-timestamp";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { ApplicantReplyPermission } from "./ApplicantReplyPermission";
import { WorkflowSection } from "./WorkflowSection";

const copy = applicantWorkflowCopy.messages;
const REPLY_BAND_CLASS =
  "border-b border-border bg-background-subtle px-card-x py-parent-y";

function useMessagesProps(
  model: ApplicantWorkflowModel,
): ConversationMessagesProps {
  const session = useOptionalWorkflowSession();
  return {
    entries: (session?.messages ?? []).map((message) => ({
      kind: "message",
      key: message.id,
      direction: message.senderType === "PROVIDER" ? "sent" : "received",
      author:
        message.senderType === "PROVIDER" ? copy.own : model.applicant.name,
      time: formatWorkflowTimestamp(message.createdAt),
      iso: message.createdAt,
      body: message.body,
    })),
    loadState:
      session?.messagesStatus === "error"
        ? {
            status: "error",
            label: session.actionError ?? copy.loadError,
            retryLabel: applicantWorkflowCopy.retry,
            onRetry: () => session.ensureMessages(true),
          }
        : session?.messagesStatus === "loading" ||
            session?.messagesStatus === "idle"
          ? { status: "loading", label: copy.loading }
          : { status: "ready" },
    emptyLabel: copy.empty,
    logLabel: copy.logLabel,
  };
}

function useComposerProps(
  model: ApplicantWorkflowModel,
): ConversationComposerProps {
  const session = useOptionalWorkflowSession();
  const [body, setBody] = useState("");
  const id = useId();
  const blockedReason =
    !session || session.sending || model.canSend
      ? null
      : model.conversationReadOnly
        ? copy.readOnlyText(model.applicant.name)
        : copy.sendUnavailable;
  const sendError =
    session?.actionArea === "messages" && session.messagesStatus !== "error"
      ? session.actionError
      : null;
  return {
    id,
    value: body,
    onChange: setBody,
    onSubmit: () => {
      if (!session || !model.canSend || session.sending || session.acting)
        return;
      void session.sendMessage(body).then((result) => {
        if (result === "done") setBody("");
      });
    },
    disabled: !session || !model.canSend || session.acting,
    sending: session?.sending ?? false,
    label: copy.composerLabel(model.applicant.name),
    placeholder: model.conversationReadOnly
      ? copy.readOnly
      : copy.composerPlaceholder,
    hint: copy.shortcut,
    disabledReason: blockedReason,
    sendLabel: copy.send,
    sendingLabel: copy.sending,
    error: sendError,
  };
}

export function MessageComposer({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return <ConversationComposer {...useComposerProps(model)} />;
}

function ReadOnlyNotice({ model }: { readonly model: ApplicantWorkflowModel }) {
  if (!model.conversationReadOnly) return null;
  return (
    <ConversationNotice
      icon={LockKeyhole}
      title={copy.readOnly}
      text={copy.readOnlyText(model.applicant.name)}
    />
  );
}

export function MessagesSection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const messages = useMessagesProps(model);
  const composer = useComposerProps(model);
  return (
    <WorkflowSection
      icon={MessageSquare}
      title={copy.title}
      sectionKey="messages"
    >
      <ReadOnlyNotice model={model} />
      <div className={REPLY_BAND_CLASS}>
        <ApplicantReplyPermission model={model} />
      </div>
      <Conversation
        className="h-96"
        scrollMode="contained"
        {...messages}
        composer={composer}
      />
    </WorkflowSection>
  );
}

export function DedicatedProviderChat({
  model,
  onClose,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly onClose: () => void;
}) {
  const messages = useMessagesProps(model);
  const composer = useComposerProps(model);
  return (
    <MobileChatView
      title={copy.title}
      closeLabel={copy.closeChat}
      onClose={onClose}
      accessory={<ApplicantReplyPermission model={model} />}
    >
      <ReadOnlyNotice model={model} />
      <Conversation
        className="min-h-0 flex-1"
        scrollMode="contained"
        {...messages}
        composer={composer}
      />
    </MobileChatView>
  );
}

export function MessagesPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const messages = useMessagesProps(model);
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <ReadOnlyNotice model={model} />
      <div className={REPLY_BAND_CLASS}>
        <ApplicantReplyPermission model={model} />
      </div>
      <ConversationMessages {...messages} />
    </div>
  );
}
