import { buildApplicationAttentionChips } from "@/lib/attention/chips";
import type { AttentionChipModel } from "@/lib/attention/chips";
import { hasApplicationAttentionSurface } from "@/lib/attention/visibility";
import { formatEUR } from "@/features/applicant/listings/utils/format";
import type { ApplicantApplicationCard } from "../api/overview";
import { applicationsCopy } from "../copy";
import { formatDate } from "./format-date";
import { STATUS_PRESENTATION, type StatusPresentation } from "./status";

const copy = applicationsCopy.overview;

export interface OverviewCardModel {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly location: string | null;
  readonly imageUrl: string | null;
  readonly status: StatusPresentation;
  readonly dates: string;
  readonly attentionChips: readonly AttentionChipModel[];
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

export function toOverviewCardModel(
  card: ApplicantApplicationCard,
): OverviewCardModel {
  const status = STATUS_PRESENTATION[card.status];
  const title = card.listing.title?.trim() || copy.untitledListing;
  const location = locationLine(card);
  const dates = datesLine(card);
  const attentionChips = buildApplicationAttentionChips(card.attention);
  const needsAttention = hasApplicationAttentionSurface(card.attention);
  const ariaLabel = [
    title,
    location,
    `${copy.statusPrefix}: ${status.label}`,
    dates,
    ...attentionChips.map((chip) => chip.label),
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
    attentionChips,
    ariaLabel,
    needsAttention,
  };
}
