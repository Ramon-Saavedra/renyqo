import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  CircleCheck,
  CircleDot,
  CircleMinus,
  FileCheck,
  FilePlus,
  FileX,
  MessageSquare,
  Send,
  ThumbsDown,
  ThumbsUp,
  Undo2,
  Upload,
} from "lucide-react";
import type { ActivityItem, ActivityType } from "../api/activity-schema";
import { documentLabel } from "./document-labels";
import { formatDateTime } from "./format-date";
import type { Tone } from "./tone";

interface ActivityPresentation {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tone: Tone;
}

const FIXED: Record<
  Exclude<
    ActivityType,
    | "MESSAGE_SENT"
    | "DOCUMENT_REQUESTED"
    | "DOCUMENT_REQUEST_CANCELLED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_REVIEWED"
  >,
  ActivityPresentation
> = {
  APPLICATION_SUBMITTED: {
    label: "Bewerbung eingereicht",
    icon: FileCheck,
    tone: "neutral",
  },
  APPLICATION_PROMOTED_TO_ACTIVE: {
    label: "In den aktiven Prozess aufgenommen",
    icon: CircleDot,
    tone: "primary",
  },
  APPLICATION_RESTORED: {
    label: "Bewerbung wieder aufgenommen",
    icon: CircleDot,
    tone: "primary",
  },
  APPLICATION_ACCEPTED: {
    label: "Zusage erhalten",
    icon: CircleCheck,
    tone: "success",
  },
  APPLICATION_REJECTED: {
    label: "Absage erhalten",
    icon: CircleMinus,
    tone: "neutral",
  },
  APPLICATION_WITHDRAWN: {
    label: "Bewerbung zurückgezogen",
    icon: Undo2,
    tone: "neutral",
  },
  CONVERSATION_OPENED: {
    label: "Unterhaltung begonnen",
    icon: MessageSquare,
    tone: "neutral",
  },
  VIEWING_PROPOSED: {
    label: "Besichtigung vorgeschlagen",
    icon: Calendar,
    tone: "neutral",
  },
  VIEWING_RESCHEDULED: {
    label: "Neuer Besichtigungstermin vorgeschlagen",
    icon: CalendarClock,
    tone: "neutral",
  },
  VIEWING_ACCEPTED: {
    label: "Besichtigung angenommen",
    icon: CalendarCheck,
    tone: "neutral",
  },
  VIEWING_DECLINED: {
    label: "Besichtigung abgelehnt",
    icon: CalendarX,
    tone: "neutral",
  },
  VIEWING_CHANGE_REQUESTED: {
    label: "Andere Zeit angefragt",
    icon: CalendarClock,
    tone: "neutral",
  },
  VIEWING_CANCELLED: {
    label: "Besichtigung abgesagt",
    icon: CalendarX,
    tone: "neutral",
  },
  VIEWING_COMPLETED: {
    label: "Besichtigung hat stattgefunden",
    icon: Check,
    tone: "neutral",
  },
  VIEWING_NO_SHOW: {
    label: "Besichtigung als nicht wahrgenommen vermerkt",
    icon: CalendarX,
    tone: "neutral",
  },
  VIEWING_OUTCOME_CORRECTED: {
    label: "Ergebnis der Besichtigung aktualisiert",
    icon: CalendarCheck,
    tone: "neutral",
  },
  VIEWING_INTEREST_CONFIRMED: {
    label: "Weiteres Interesse bestätigt",
    icon: ThumbsUp,
    tone: "primary",
  },
  VIEWING_INTEREST_DECLINED: {
    label: "Kein weiteres Interesse mitgeteilt",
    icon: ThumbsDown,
    tone: "neutral",
  },
};

function documentName(item: ActivityItem): string {
  const type = item.payload?.documentType;
  return type ? documentLabel(type, null) : "Unterlage";
}

function presentation(item: ActivityItem): ActivityPresentation {
  switch (item.type) {
    case "MESSAGE_SENT":
      return item.actorType === "APPLICANT"
        ? {
            label: "Du hast eine Nachricht gesendet",
            icon: Send,
            tone: "neutral",
          }
        : {
            label: "Nachricht vom Anbieter erhalten",
            icon: MessageSquare,
            tone: "neutral",
          };
    case "DOCUMENT_REQUESTED":
      return {
        label: `${documentName(item)} angefordert`,
        icon: FilePlus,
        tone: "neutral",
      };
    case "DOCUMENT_REQUEST_CANCELLED":
      return {
        label: `Anforderung zurückgenommen: ${documentName(item)}`,
        icon: FileX,
        tone: "neutral",
      };
    case "DOCUMENT_UPLOADED":
      return {
        label: `${documentName(item)} hochgeladen`,
        icon: Upload,
        tone: "neutral",
      };
    case "DOCUMENT_REVIEWED":
      return {
        label: `${documentName(item)} geprüft`,
        icon: FileCheck,
        tone: "success",
      };
    default:
      return FIXED[item.type];
  }
}

export interface ActivityEntry extends ActivityPresentation {
  readonly id: string;
  readonly occurredAt: string;
  readonly dateLabel: string;
}

export function toActivityEntry(item: ActivityItem): ActivityEntry {
  return {
    ...presentation(item),
    id: item.id,
    occurredAt: item.occurredAt,
    dateLabel: formatDateTime(item.occurredAt),
  };
}
