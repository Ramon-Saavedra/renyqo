import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  RefreshCw,
} from "lucide-react";
import type {
  ApplicationStatus,
  ViewingSnapshot,
  ViewingStatus,
  ViewingSummary,
} from "../api/shared-schemas";
import { applicationsCopy } from "../copy";
import type { Tone } from "./tone";

const copy = applicationsCopy.viewing;

interface ViewingStatePresentation {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tone: Tone;
}

export const VIEWING_STATE: Record<ViewingStatus, ViewingStatePresentation> = {
  PROPOSED: {
    label: copy.states.PROPOSED,
    icon: CalendarClock,
    tone: "primary",
  },
  ACCEPTED: {
    label: copy.states.ACCEPTED,
    icon: CalendarCheck,
    tone: "success",
  },
  CHANGE_REQUESTED: {
    label: copy.states.CHANGE_REQUESTED,
    icon: CalendarClock,
    tone: "neutral",
  },
  DECLINED: { label: copy.states.DECLINED, icon: CalendarX, tone: "neutral" },
  COMPLETED: { label: copy.states.COMPLETED, icon: Check, tone: "neutral" },
  NO_SHOW: { label: copy.states.NO_SHOW, icon: CalendarX, tone: "warning" },
  CANCELLED: { label: copy.states.CANCELLED, icon: CalendarX, tone: "neutral" },
  SUPERSEDED: {
    label: copy.states.SUPERSEDED,
    icon: RefreshCw,
    tone: "neutral",
  },
};

export function displayedViewing(
  summary: ViewingSummary,
): ViewingSnapshot | null {
  return (
    summary.current ??
    summary.pendingInterest ??
    summary.changeRequested ??
    summary.latest
  );
}

export function findViewing(
  summary: ViewingSummary,
  viewingId: string,
): ViewingSnapshot | null {
  return (
    [
      summary.current,
      summary.pendingInterest,
      summary.changeRequested,
      summary.latest,
      summary.latestCompleted,
    ].find((viewing) => viewing?.viewingId === viewingId) ?? null
  );
}

export function viewingStatusText(
  viewing: ViewingSnapshot,
  applicationStatus: ApplicationStatus,
): string {
  const live = applicationStatus === "ACTIVE";
  switch (viewing.status) {
    case "PROPOSED":
      return live ? copy.texts.PROPOSED : copy.texts.PROPOSED_CLOSED;
    case "CHANGE_REQUESTED":
      return live
        ? copy.texts.CHANGE_REQUESTED
        : copy.texts.CHANGE_REQUESTED_CLOSED;
    case "COMPLETED":
      return viewing.capabilities.canSubmitInterest
        ? copy.texts.COMPLETED_PENDING
        : copy.texts.COMPLETED;
    default:
      return copy.texts[viewing.status];
  }
}
