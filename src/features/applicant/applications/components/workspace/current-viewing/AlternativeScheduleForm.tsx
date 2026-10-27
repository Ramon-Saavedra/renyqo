"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import {
  proposeApplicantAlternative,
  proposeApplicantAppointmentAlternative,
} from "@/features/viewing-workflow/api/applicant-workflow";
import type { WorkflowScheduleInput } from "@/lib/viewing-workflow/command-schema";
import { ScheduleFields } from "@/features/viewing-workflow/present/ScheduleFields";
import {
  useScheduleDraft,
  type ScheduleFieldValues,
} from "@/features/viewing-workflow/present/use-schedule-draft";
import { allowedCapability } from "../../../model/viewing-capability";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { currentViewingCopy as copy } from "./copy";
import type { useApplicantViewingCommands } from "./useApplicantViewingCommands";

type Commands = ReturnType<typeof useApplicantViewingCommands>;

const labels = {
  date: copy.date,
  start: copy.start,
  end: copy.end,
  message: copy.optionalMessage,
  invalidTime: copy.invalidTime,
  cancel: copy.cancelForm,
  send: copy.sendProposal,
  sending: copy.sending,
  shortNoticeTitle: copy.shortNoticeTitle,
  shortNoticeText: copy.shortNoticeText,
  shortNoticeConfirm: copy.shortNoticeConfirm,
};

function scheduleTarget(capabilities: readonly WorkflowCapability[]): {
  readonly kind: "proposal" | "appointment";
  readonly id: string;
} | null {
  const counter = allowedCapability(capabilities, "COUNTERPROPOSE");
  if (counter) {
    return counter.target.proposalId
      ? { kind: "proposal", id: counter.target.proposalId }
      : null;
  }
  const replacement = allowedCapability(capabilities, "PROPOSE_REPLACEMENT");
  return replacement?.target.appointmentId
    ? { kind: "appointment", id: replacement.target.appointmentId }
    : null;
}

export function AlternativeScheduleForm({
  applicationId,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const target = scheduleTarget(capabilities);
  const [open, setOpen] = useState(false);
  const draft = useScheduleDraft();
  if (!target) return null;
  const busy = commands.pending !== null;

  const submit = (
    fields: ScheduleFieldValues,
    acknowledgeShortNotice: boolean,
  ) => {
    const schedule = draft.build(acknowledgeShortNotice, fields);
    if (!schedule) return;
    const send = (input: WorkflowScheduleInput) =>
      target.kind === "proposal"
        ? proposeApplicantAlternative(applicationId, target.id, input)
        : proposeApplicantAppointmentAlternative(
            applicationId,
            target.id,
            input,
          );
    void commands
      .run("schedule", (input) => send({ ...input, ...schedule }))
      .then((status) => {
        if (status === "success" || status === "stale") {
          setOpen(false);
          draft.setShortNotice(false);
          return;
        }
        if (status === "short-notice") draft.setShortNotice(true);
      });
  };

  if (!open) {
    return (
      <Button variant="outline" disabled={busy} onClick={() => setOpen(true)}>
        {copy.proposeTime}
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
