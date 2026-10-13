import type { ApplicationAdmission } from "../api/application-admission";
import type {
  ListingApplicationPublicReason,
  ProfileMatchResult,
} from "../types";

export type ListingProcessState =
  | "applied"
  | "ended-profile"
  | "not-selected"
  | "accepted"
  | "rented"
  | "unavailable"
  | "none";

export type ListingCompatibilityState =
  | "match"
  | "no-match"
  | "incomplete"
  | "unknown"
  | "hidden";

export interface ListingApplicationUi {
  readonly process: ListingProcessState;
  readonly compatibility: ListingCompatibilityState;
  readonly action: "submit" | "withdraw" | "none";
  readonly blockReason: ApplicationAdmission["submissionBlockReason"];
  readonly reapplyAvailableAt: string | null;
}

export function resolveListingApplicationUi(input: {
  readonly admission: ApplicationAdmission;
  readonly matchesProfile: ProfileMatchResult;
  readonly publicReason?: ListingApplicationPublicReason | null;
  readonly showMatch?: boolean;
}): ListingApplicationUi {
  const {
    admission,
    matchesProfile,
    publicReason = null,
    showMatch = true,
  } = input;
  const current =
    admission.currentApplicationStatus === "ACTIVE" ||
    admission.currentApplicationStatus === "WAITING";
  const reason = admission.submissionBlockReason;
  let process: ListingProcessState = "none";
  if (current) process = "applied";
  else if (reason === "APPLICATION_REAPPLICATION_COOLDOWN")
    process = "not-selected";
  else if (reason === "APPLICATION_ACCEPTED") process = "accepted";
  else if (reason === "LISTING_RENTED") process = "rented";
  else if (
    reason !== null &&
    reason !== "APPLICANT_NOT_ELIGIBLE" &&
    reason !== "AUTHENTICATION_REQUIRED"
  )
    process = "unavailable";
  else if (publicReason === "PROFILE_NO_LONGER_ELIGIBLE")
    process = "ended-profile";
  return {
    process,
    compatibility: showMatch ? matchesProfile : "hidden",
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
