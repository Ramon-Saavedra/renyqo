import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarClock, Check } from "lucide-react";
import { formatEUR } from "@/features/applicant/listings/utils/format";
import type { ApplicantApplicationCard } from "../api/overview";
import { applicationsCopy } from "../copy";
import { formatDate } from "./format-date";
import { STATUS_PRESENTATION, type StatusPresentation } from "./status";

const copy = applicationsCopy.overview;

type OverviewViewingStatus = keyof typeof applicationsCopy.overviewViewing;

const OVERVIEW_VIEWING_ICON: Record<OverviewViewingStatus, LucideIcon> = {
  PROPOSED: CalendarClock,
  ACCEPTED: CalendarCheck,
  CHANGE_REQUESTED: CalendarClock,
  COMPLETED: Check,
};

function isOverviewViewingStatus(
  status: string,
): status is OverviewViewingStatus {
  return status in OVERVIEW_VIEWING_ICON;
}

export interface OverviewCardModel {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly location: string | null;
  readonly imageUrl: string | null;
  readonly status: StatusPresentation;
  readonly dates: string;
  readonly pending: string | null;
  readonly unread: string | null;
  readonly missingDocuments: string | null;
  readonly viewing: {
    readonly label: string;
    readonly icon: LucideIcon;
  } | null;
  readonly ariaLabel: string;
  readonly needsAttention: boolean;
}

function applicationHref(applicationId: string): string {
  return `/applicant/applications/${encodeURIComponent(applicationId)}`;
}

function locationLine(card: ApplicantApplicationCard): string | null {
  const parts = [
    card.listing.city,
    card.listing.coldRent === null
      ? null
      : copy.coldRent(formatEUR(card.listing.coldRent)),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" · ") : null;
}

function datesLine(card: ApplicantApplicationCard): string {
  const submitted = copy.submittedAt(formatDate(card.submittedAt));
  if (!card.activeAt) return submitted;
  const active = formatDate(card.activeAt);
  return `${submitted} · ${
    card.status === "ACTIVE"
      ? copy.activeSince(active)
      : copy.activeFrom(active)
  }`;
}

function viewingIndicator(
  card: ApplicantApplicationCard,
): OverviewCardModel["viewing"] {
  const latest = card.viewing.latest;
  if (card.status !== "ACTIVE" || !latest) return null;
  if (!isOverviewViewingStatus(latest.status)) return null;
  return {
    label: applicationsCopy.overviewViewing[latest.status],
    icon: OVERVIEW_VIEWING_ICON[latest.status],
  };
}

export function toOverviewCardModel(
  card: ApplicantApplicationCard,
): OverviewCardModel {
  const status = STATUS_PRESENTATION[card.status];
  const title = card.listing.title?.trim() || copy.untitledListing;
  const location = locationLine(card);
  const dates = datesLine(card);
  const pending =
    card.attention.pendingActionCount > 0
      ? copy.pendingSteps(card.attention.pendingActionCount)
      : null;
  const unread =
    card.attention.actionableUnreadMessageCount > 0
      ? copy.unreadMessages(card.attention.actionableUnreadMessageCount)
      : null;
  const missingDocuments =
    card.documents.uploadRequiredCount > 0
      ? copy.missingDocuments(card.documents.uploadRequiredCount)
      : null;
  const viewing = viewingIndicator(card);
  const ariaLabel = [
    title,
    location,
    `${copy.statusPrefix}: ${status.label}`,
    dates,
    pending,
    unread,
    missingDocuments,
    viewing?.label ?? null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");

  return {
    id: card.applicationId,
    href: applicationHref(card.applicationId),
    title,
    location,
    imageUrl: card.listing.imageUrl,
    status,
    dates,
    pending,
    unread,
    missingDocuments,
    viewing,
    ariaLabel,
    needsAttention: pending !== null || unread !== null,
  };
}
