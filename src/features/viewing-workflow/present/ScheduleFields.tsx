"use client";

import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/Textarea";
import type { ScheduleFieldValues } from "./use-schedule-draft";

function valuesFrom(form: HTMLFormElement): ScheduleFieldValues {
  const data = new FormData(form);
  return {
    date: String(data.get("date") ?? ""),
    start: String(data.get("start") ?? ""),
    end: String(data.get("end") ?? ""),
    message: String(data.get("message") ?? ""),
  };
}

export function ScheduleFields({
  date,
  start,
  end,
  message,
  shortNotice,
  invalidTime,
  ready,
  busy,
  sending,
  labels,
  onDate,
  onStart,
  onEnd,
  onMessage,
  onCancel,
  onSubmit,
  onConfirmShortNotice,
}: {
  readonly date: string;
  readonly start: string;
  readonly end: string;
  readonly message: string;
  readonly shortNotice: boolean;
  readonly invalidTime: boolean;
  readonly ready: boolean;
  readonly busy: boolean;
  readonly sending: boolean;
  readonly labels: {
    readonly date: string;
    readonly start: string;
    readonly end: string;
    readonly message: string;
    readonly invalidTime: string;
    readonly cancel: string;
    readonly send: string;
    readonly sending: string;
    readonly shortNoticeTitle: string;
    readonly shortNoticeText: string;
    readonly shortNoticeConfirm: string;
  };
  readonly onDate: (value: string) => void;
  readonly onStart: (value: string) => void;
  readonly onEnd: (value: string) => void;
  readonly onMessage: (value: string) => void;
  readonly onCancel: () => void;
  readonly onSubmit: (fields: ScheduleFieldValues) => void;
  readonly onConfirmShortNotice: (fields: ScheduleFieldValues) => void;
}) {
  const submit =
    (handler: (fields: ScheduleFieldValues) => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      const form = event.currentTarget.form;
      if (!form) return;
      handler(valuesFrom(form));
    };

  return (
    <form
      className="flex flex-col gap-2.5 rounded-md border border-border-strong px-2.5 py-3.5 sm:px-3.5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-caption font-medium text-foreground-secondary">
          {labels.date}
          <Input
            type="date"
            density="compact"
            name="date"
            value={date}
            aria-label={labels.date}
            onChange={(event) => onDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-caption font-medium text-foreground-secondary">
          {labels.start}
          <Input
            type="time"
            density="compact"
            name="start"
            value={start}
            aria-label={labels.start}
            onChange={(event) => onStart(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-caption font-medium text-foreground-secondary">
          {labels.end}
          <Input
            type="time"
            density="compact"
            name="end"
            value={end}
            aria-label={labels.end}
            onChange={(event) => onEnd(event.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-caption font-medium text-foreground-secondary">
        {labels.message}
        <Textarea
          rows={2}
          maxLength={500}
          name="message"
          value={message}
          onChange={(event) => onMessage(event.target.value)}
        />
      </label>
      {invalidTime ? (
        <p role="alert" className="text-caption text-warning">
          {labels.invalidTime}
        </p>
      ) : null}
      {shortNotice ? (
        <div className="flex flex-col gap-2 rounded-sm border border-border bg-background-subtle px-2.5 py-3">
          <p className="text-lead font-medium text-foreground">
            {labels.shortNoticeTitle}
          </p>
          <p className="text-body text-foreground-secondary">
            {labels.shortNoticeText}
          </p>
          <Button
            variant="primary"
            disabled={busy || !ready}
            onClick={submit(onConfirmShortNotice)}
          >
            {sending ? labels.sending : labels.shortNoticeConfirm}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={onCancel}>
            {labels.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={busy || !ready}
            onClick={submit(onSubmit)}
          >
            {sending ? labels.sending : labels.send}
          </Button>
        </div>
      )}
    </form>
  );
}
