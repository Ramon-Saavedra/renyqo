"use client";

import { useState } from "react";
import {
  VIEWING_SCHEDULE_ZONE,
  berlinLocalToInstant,
} from "@/features/applicant/applications/model/berlin-instant";

export function plusThirtyMinutes(time: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  const total = hour * 60 + minute + 30;
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface ScheduleDraftInput {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly timeZone: string;
  readonly message?: string;
  readonly shortNotice?: true;
}

export interface ScheduleFieldValues {
  readonly date: string;
  readonly start: string;
  readonly end: string;
  readonly message: string;
}

export function useScheduleDraft() {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [endEdited, setEndEdited] = useState(false);
  const [message, setMessage] = useState("");
  const [shortNotice, setShortNotice] = useState(false);
  const [invalidTime, setInvalidTime] = useState(false);
  const ready = date.length > 0 && start.length > 0 && end.length > 0;

  const changeDate = (value: string) => {
    setDate(value);
    setShortNotice(false);
    setInvalidTime(false);
  };

  const changeStart = (value: string) => {
    setStart(value);
    setShortNotice(false);
    setInvalidTime(false);
    if (!endEdited) setEnd(plusThirtyMinutes(value) ?? "");
  };

  const changeEnd = (value: string) => {
    setEndEdited(true);
    setEnd(value);
    setShortNotice(false);
    setInvalidTime(false);
  };

  const build = (
    acknowledgeShortNotice: boolean,
    fields?: ScheduleFieldValues,
  ): ScheduleDraftInput | null => {
    const chosen = fields ?? { date, start, end, message };
    if (fields) {
      setDate(fields.date);
      setStart(fields.start);
      setEnd(fields.end);
      setMessage(fields.message);
      setEndEdited(fields.end !== (plusThirtyMinutes(fields.start) ?? ""));
    }
    const startsAt = berlinLocalToInstant(chosen.date, chosen.start);
    const endsAt = berlinLocalToInstant(chosen.date, chosen.end);
    if (!startsAt || !endsAt) {
      setInvalidTime(true);
      return null;
    }
    const trimmed = chosen.message.trim();
    return {
      startsAt,
      endsAt,
      timeZone: VIEWING_SCHEDULE_ZONE,
      ...(trimmed ? { message: trimmed } : {}),
      ...(acknowledgeShortNotice ? { shortNotice: true as const } : {}),
    };
  };

  return {
    date,
    start,
    end,
    message,
    shortNotice,
    invalidTime,
    ready,
    changeDate,
    changeStart,
    changeEnd,
    setMessage,
    setShortNotice,
    build,
  };
}
