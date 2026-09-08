import type {
  ListingApplicationPublicReason,
  ListingApplicationStatus,
} from "../types";

export type ListingCardBadgeKind =
  | "not-selected"
  | "applied"
  | "match"
  | "no-match"
  | "none";

export function isNotSelectedRejection(
  applicationStatus: ListingApplicationStatus | null,
  publicReason: ListingApplicationPublicReason | null,
): boolean {
  return applicationStatus === "REJECTED" && publicReason === "NOT_SELECTED";
}

export function resolveListingCardBadge(input: {
  readonly applicationStatus: ListingApplicationStatus | null;
  readonly publicReason: ListingApplicationPublicReason | null;
  readonly matchesProfile: boolean | null;
  readonly showMatch: boolean;
}): ListingCardBadgeKind {
  const { applicationStatus, publicReason, matchesProfile, showMatch } = input;

  if (isNotSelectedRejection(applicationStatus, publicReason)) {
    return "not-selected";
  }

  if (
    applicationStatus === "ACTIVE" ||
    applicationStatus === "WAITING" ||
    applicationStatus === "ACCEPTED" ||
    applicationStatus === "REJECTED"
  ) {
    return "applied";
  }

  if (!showMatch || matchesProfile === null) {
    return "none";
  }

  return matchesProfile ? "match" : "no-match";
}
