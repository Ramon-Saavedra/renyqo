import type { ApplicationAdmission } from "../api/application-admission";
import type { ProfileMatchResult } from "../types";

export type ListingCardBadgeKind =
  | "applied"
  | "not-selected"
  | "accepted"
  | "rented"
  | "unavailable"
  | "match"
  | "no-match"
  | "incomplete"
  | "none";

export function resolveListingApplicationUi(input: {
  readonly admission: ApplicationAdmission;
  readonly matchesProfile: ProfileMatchResult;
  readonly showMatch?: boolean;
}): {
  readonly badge: ListingCardBadgeKind;
  readonly action: "submit" | "withdraw" | "none";
  readonly blockReason: ApplicationAdmission["submissionBlockReason"];
  readonly reapplyAvailableAt: string | null;
} {
  const { admission, matchesProfile, showMatch = true } = input;
  const current =
    admission.currentApplicationStatus === "ACTIVE" ||
    admission.currentApplicationStatus === "WAITING";
  const reason = admission.submissionBlockReason;
  let badge: ListingCardBadgeKind = "none";
  if (current) badge = "applied";
  else if (reason === "APPLICATION_REAPPLICATION_COOLDOWN")
    badge = "not-selected";
  else if (reason === "APPLICATION_ACCEPTED") badge = "accepted";
  else if (reason === "LISTING_RENTED") badge = "rented";
  else if (
    reason !== null &&
    reason !== "APPLICANT_NOT_ELIGIBLE" &&
    reason !== "AUTHENTICATION_REQUIRED"
  )
    badge = "unavailable";
  else if (showMatch && matchesProfile === "match") badge = "match";
  else if (showMatch && matchesProfile === "no-match") badge = "no-match";
  else if (showMatch && matchesProfile === "incomplete") badge = "incomplete";
  return {
    badge,
    action:
      current && admission.currentApplicationId !== null
        ? "withdraw"
        : admission.canSubmitApplication
          ? "submit"
          : "none",
    blockReason: reason,
    reapplyAvailableAt: admission.reapplyAvailableAt,
  };
}
