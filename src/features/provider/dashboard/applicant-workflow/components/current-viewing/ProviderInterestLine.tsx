"use client";

import { formatDateTime } from "@/features/applicant/applications/model/format-date";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

function interestLine(
  interest: NonNullable<ViewingWorkflowProjection["applicantInterest"]>,
): string | null {
  if (interest.state === "PENDING") return copy.interestPending;
  if (interest.state === "STILL_INTERESTED") return copy.interestStill;
  if (interest.state === "NOT_INTERESTED") return copy.interestNot;
  if (interest.state === "EXPIRED") return copy.interestExpired;
  if (interest.state === "CLOSED" || interest.state === "LEGACY_UNANSWERED") {
    return copy.interestClosed;
  }
  return null;
}

export function ProviderInterestLine({
  interest,
}: {
  readonly interest: ViewingWorkflowProjection["applicantInterest"];
}) {
  if (!interest) return null;
  const line = interestLine(interest);
  if (!line) return null;
  return (
    <p className="text-body text-foreground-secondary">
      {line}
      {interest.deadlineAt
        ? ` ${copy.deadline(formatDateTime(interest.deadlineAt))}`
        : ""}
    </p>
  );
}
