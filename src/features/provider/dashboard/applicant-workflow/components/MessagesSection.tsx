import { useState } from "react";
import { LockKeyhole, MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicantWorkflowCopy } from "../copy";
import { formatWorkflowTimestamp } from "../format-timestamp";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { StatusTag } from "./StatusTag";
import { WorkflowSection } from "./WorkflowSection";

const copy = applicantWorkflowCopy.messages;

function MessageList() {
  const session = useOptionalWorkflowSession();
  if (!session || session.messagesStatus === "idle") return null;
  const { messages, messagesStatus, actionError, model } = session;
  if (messagesStatus === "loading") {
    return (
      <p className="text-caption text-foreground-secondary">{copy.loading}</p>
    );
  }
  if (messagesStatus === "error") {
    return (
      <p className="text-caption text-foreground-secondary" role="alert">
        {actionError ?? copy.loadError}
      </p>
    );
  }
  if (messages.length === 0) {
    return (
      <p className="text-caption text-foreground-secondary">{copy.empty}</p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((message) => {
        const own = message.senderType === "PROVIDER";
        return (
          <li
            key={message.id}
            className={own ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                own
                  ? "flex max-w-full flex-col items-end gap-1 pl-8"
                  : "flex max-w-full flex-col items-start gap-1 pr-8"
              }
            >
              <p className="text-caption text-foreground-secondary">
                {own ? "Du" : model.applicant.name}
                {" · "}
                {formatWorkflowTimestamp(message.createdAt)}
              </p>
              <p
                className={
                  own
                    ? "w-fit max-w-full rounded-md bg-primary px-3 py-2 text-caption leading-normal whitespace-pre-wrap break-words text-primary-foreground"
                    : "w-fit max-w-full rounded-md border border-border bg-background px-3 py-2 text-caption leading-normal whitespace-pre-wrap break-words text-foreground"
                }
              >
                {message.body}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MessageComposer({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const session = useOptionalWorkflowSession();
  const [body, setBody] = useState("");
  const sending = session?.sending ?? false;
  const disabled = !session || !model.canSend || sending || session.acting;
  const blockedReason =
    !session || sending || model.canSend
      ? null
      : model.conversationReadOnly
        ? copy.readOnlyText(model.applicant.name)
        : !model.conversationOpen
          ? copy.conversationClosed
          : model.expectedResponder === "APPLICANT"
            ? copy.sendBlockedUntilApplicant(model.applicant.name)
            : copy.sendUnavailable;

  const turn =
    blockedReason || !model.conversationOpen || model.conversationReadOnly
      ? null
      : model.canSend
        ? copy.waitingForYou
        : null;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!session || disabled) return;
        const next = body;
        void session.sendMessage(next).then((result) => {
          if (result === "done") setBody("");
        });
      }}
    >
      <label htmlFor="workflow-message" className="sr-only">
        {copy.composerLabel(model.applicant.name)}
      </label>
      <div
        title={blockedReason ?? undefined}
        className={
          blockedReason
            ? "flex cursor-not-allowed flex-col gap-2"
            : "flex flex-col gap-2"
        }
      >
        <Textarea
          id="workflow-message"
          rows={3}
          value={body}
          disabled={disabled}
          aria-describedby={
            blockedReason ? "workflow-message-reason" : undefined
          }
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            model.conversationReadOnly
              ? copy.readOnly
              : copy.composerPlaceholder
          }
          className={
            blockedReason
              ? "pointer-events-none disabled:opacity-50"
              : "disabled:cursor-not-allowed disabled:opacity-50"
          }
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          className={
            blockedReason ? "pointer-events-none self-end" : "self-end"
          }
          disabled={disabled || body.trim().length === 0}
        >
          <AppIcon icon={SendHorizontal} size={18} strokeWidth={2} decorative />
          {copy.send}
        </Button>
      </div>
      {blockedReason ? (
        <p
          id="workflow-message-reason"
          className="text-caption text-foreground-secondary"
        >
          {blockedReason}
        </p>
      ) : turn ? (
        <p className="text-caption text-foreground-secondary">{turn}</p>
      ) : null}
      {session?.actionArea === "messages" &&
      session.actionError &&
      session.messagesStatus !== "error" ? (
        <p role="alert" className="text-caption text-foreground-secondary">
          {session.actionError}
        </p>
      ) : null}
    </form>
  );
}

function ReadOnlyNotice({ model }: { readonly model: ApplicantWorkflowModel }) {
  if (!model.conversationReadOnly) return null;
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
        <AppIcon icon={LockKeyhole} size={15} strokeWidth={2} decorative />
      </span>
      <p className="text-caption text-pretty text-foreground-secondary">
        {copy.readOnlyText(model.applicant.name)}
      </p>
    </div>
  );
}

export function MessagesSection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <WorkflowSection
      icon={MessageSquare}
      title={copy.title}
      aside={
        <StatusTag tone="neutral" label={model.summaries.messages.value} />
      }
    >
      <div className="flex flex-col gap-3 px-4 py-4.5">
        <div className="flex min-h-24 flex-col gap-2">
          <ReadOnlyNotice model={model} />
          <MessageList />
        </div>
        <MessageComposer model={model} />
      </div>
    </WorkflowSection>
  );
}

export function MessagesPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <StatusTag
        tone="neutral"
        label={model.summaries.messages.value}
        className="self-start"
      />
      <ReadOnlyNotice model={model} />
      <MessageList />
    </div>
  );
}
