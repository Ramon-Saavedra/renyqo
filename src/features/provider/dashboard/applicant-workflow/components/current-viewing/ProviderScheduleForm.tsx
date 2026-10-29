"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import {
  counterproposeProviderViewing,
  inviteToProviderViewing,
  proposeProviderReplacement,
} from "@/features/viewing-workflow/api/provider-workflow";
import type { WorkflowScheduleInput } from "@/lib/viewing-workflow/command-schema";
import { ScheduleFields } from "@/features/viewing-workflow/present/ScheduleFields";
import {
  useScheduleDraft,
  type ScheduleFieldValues,
} from "@/features/viewing-workflow/present/use-schedule-draft";
import type { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

type Commands = ReturnType<typeof useViewingCommands>;

const labels = {
  date: copy.date,
  start: copy.start,
  end: copy.end,
  message: copy.optionalMessage,
  invalidTime: copy.invalidTime,
  cancel: copy.cancelForm,
  send: copy.send,
  sending: copy.sending,
  shortNoticeTitle: copy.shortNoticeTitle,
  shortNoticeText: copy.shortNoticeText,
  shortNoticeConfirm: copy.shortNoticeConfirm,
};

type ScheduleKind =
  | { readonly kind: "invite" }
  | { readonly kind: "counter"; readonly proposalId: string }
  | { readonly kind: "replacement"; readonly appointmentId: string };

function scheduleKind(
  capabilities: readonly WorkflowCapability[],
): ScheduleKind | null {
  const counter = allowedCapability(capabilities, "COUNTERPROPOSE");
  if (counter?.target.proposalId) {
    return { kind: "counter", proposalId: counter.target.proposalId };
  }
  const replacement = allowedCapability(capabilities, "PROPOSE_REPLACEMENT");
  if (replacement?.target.appointmentId) {
    return {
      kind: "replacement",
      appointmentId: replacement.target.appointmentId,
    };
  }
  if (allowedCapability(capabilities, "INVITE")) return { kind: "invite" };
  return null;
}

export function ProviderScheduleForm({
  applicationId,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const target = scheduleKind(capabilities);
  const [open, setOpen] = useState(target?.kind === "invite");
  const draft = useScheduleDraft();
  if (!target) return null;
  const busy = commands.pending !== null;
  const opener =
    target.kind === "counter"
      ? copy.counter
      : target.kind === "replacement"
        ? copy.replace
        : copy.invite;

  const submit = (
    fields: ScheduleFieldValues,
    acknowledgeShortNotice: boolean,
  ) => {
    const schedule = draft.build(acknowledgeShortNotice, fields);
    if (!schedule) return;
    const send = (input: WorkflowScheduleInput) => {
      if (target.kind === "counter") {
        return counterproposeProviderViewing(
          applicationId,
          target.proposalId,
          input,
        );
      }
      if (target.kind === "replacement") {
        return proposeProviderReplacement(
          applicationId,
          target.appointmentId,
          input,
        );
      }
      return inviteToProviderViewing(applicationId, input);
    };
    void commands
      .run("schedule", (input) => send({ ...input, ...schedule }))
      .then((status) => {
        if (status === "success" || status === "stale") {
          if (target.kind !== "invite") setOpen(false);
          draft.setShortNotice(false);
          return;
        }
        if (status === "short-notice") draft.setShortNotice(true);
      });
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {opener}
      </Button>
    );
  }

  return (
    <ScheduleFields
      date={draft.date}
      start={draft.start}
      end={draft.end}
      message={draft.message}
      shortNotice={draft.shortNotice}
      invalidTime={draft.invalidTime}
      ready={draft.ready}
      busy={busy}
      sending={commands.pending === "schedule"}
      labels={labels}
      onDate={draft.changeDate}
      onStart={draft.changeStart}
      onEnd={draft.changeEnd}
      onMessage={draft.setMessage}
      onCancel={() => setOpen(false)}
      onSubmit={(fields) => submit(fields, false)}
      onConfirmShortNotice={(fields) => submit(fields, true)}
    />
  );
}
