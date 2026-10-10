import type { LucideIcon } from "lucide-react";
import {
  CircleCheck,
  CircleDot,
  CircleMinus,
  Hourglass,
  Undo2,
} from "lucide-react";
import type { ApplicationStatus } from "../api/shared-schemas";
import { applicationsCopy } from "../copy";
import type { Tone } from "./tone";

export type OverviewGroup = "ACTIVE" | "WAITING" | "DONE";

export interface StatusPresentation {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly tone: Tone;
  readonly group: OverviewGroup;
}

export const STATUS_PRESENTATION: Record<
  ApplicationStatus,
  StatusPresentation
> = {
  ACTIVE: {
    label: applicationsCopy.status.ACTIVE,
    icon: CircleDot,
    tone: "primary",
    group: "ACTIVE",
  },
  WAITING: {
    label: applicationsCopy.status.WAITING,
    icon: Hourglass,
    tone: "neutral",
    group: "WAITING",
  },
  ACCEPTED: {
    label: applicationsCopy.status.ACCEPTED,
    icon: CircleCheck,
    tone: "success",
    group: "DONE",
  },
  REJECTED: {
    label: applicationsCopy.status.REJECTED,
    icon: CircleMinus,
    tone: "neutral",
    group: "DONE",
  },
  WITHDRAWN: {
    label: applicationsCopy.status.WITHDRAWN,
    icon: Undo2,
    tone: "neutral",
    group: "DONE",
  },
};
