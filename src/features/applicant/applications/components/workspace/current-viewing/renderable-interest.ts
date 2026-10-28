import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { allowedCapability } from "../../../model/viewing-capability";
import { currentViewingCopy as copy } from "./copy";

type Interest = ViewingWorkflowProjection["applicantInterest"];
type Obligation = ViewingWorkflowProjection["nextObligation"];

export function readOnlyInterestText(interest: Interest): string | null {
  switch (interest?.state) {
    case "STILL_INTERESTED":
      return copy.interestStill;
    case "NOT_INTERESTED":
      return copy.interestNot;
    case "PENDING":
      return copy.interestPending;
    case "EXPIRED":
      return copy.interestExpired;
    case "CLOSED":
    case "LEGACY_UNANSWERED":
      return copy.interestClosed;
    default:
      return null;
  }
}

/** Post-viewing interest the applicant can already see, from the list or nextObligation. */
export function postViewingInterestObligation(
  projection: ViewingWorkflowProjection,
): Obligation {
  const listed = projection.obligations.find(
    (item) => item.action === "APPLICANT_CONFIRM_POST_VIEWING_INTEREST",
  );
  if (listed) return listed;
  const next = projection.nextObligation;
  return next?.action === "APPLICANT_CONFIRM_POST_VIEWING_INTEREST"
    ? next
    : null;
}

export function hasRenderableInterest(
  projection: ViewingWorkflowProjection,
): boolean {
  const capability = allowedCapability(
    projection.capabilities,
    "SUBMIT_INTEREST",
  );
  return Boolean(
    capability?.target.appointmentId ||
    readOnlyInterestText(projection.applicantInterest) ||
    postViewingInterestObligation(projection),
  );
}
