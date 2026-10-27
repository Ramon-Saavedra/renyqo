import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { currentViewingCopy as copy } from "./copy";

const CLOSURE_TEXT = {
  PROVIDER_CLOSED: "Der Anbieter hat den Ablauf beendet.",
  APPLICATION_WITHDRAWN: "Die Bewerbung wurde zurückgezogen.",
  APPLICATION_REJECTED: "Die Bewerbung wurde abgelehnt.",
  APPLICATION_ACCEPTED: "Die Bewerbung wurde angenommen.",
  LISTING_RENTED: "Die Wohnung wurde vergeben.",
  LISTING_ARCHIVED: "Das Inserat wurde archiviert.",
  LISTING_UNPUBLISHED: "Das Inserat ist nicht mehr veröffentlicht.",
  ELIGIBILITY_REJECTED: "Die Bewerbung erfüllt die Voraussetzungen nicht.",
  POST_VIEWING_RESPONSE_EXPIRED:
    "Die Frist für die Rückmeldung nach der Besichtigung ist abgelaufen.",
} as const;

function outcomeText(
  outcome: NonNullable<ViewingWorkflowProjection["outcome"]>,
): string {
  if (outcome.outcome === "COMPLETED") return copy.completed;
  if (outcome.absenceSide === "APPLICANT") return copy.applicantAbsent;
  if (outcome.absenceSide === "PROVIDER") return copy.providerAbsent;
  if (outcome.absenceSide === "BOTH") return copy.bothAbsent;
  return copy.recorded;
}

export function ReadOnlyViewingFacts({
  projection,
}: {
  readonly projection: ViewingWorkflowProjection;
}) {
  const expired =
    projection.pendingProposal === null &&
    projection.latestProposal?.effectiveResolution === "EXPIRED";
  const closed = projection.closure?.state === "CLOSED";
  const latestAppointment = projection.latestAppointment;
  const cancelledWithoutConfirmed =
    projection.confirmedAppointment === null &&
    latestAppointment !== null &&
    (latestAppointment.status === "CANCELLED" ||
      latestAppointment.cancellation !== null);
  const facts = [
    projection.outcome ? outcomeText(projection.outcome) : null,
    cancelledWithoutConfirmed ? copy.cancelledFact : null,
    expired ? copy.expiredProposal : null,
    closed
      ? projection.closure?.reason
        ? CLOSURE_TEXT[projection.closure.reason]
        : copy.closed
      : null,
  ].filter((fact): fact is string => fact !== null);
  if (facts.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {facts.map((fact) => (
        <p key={fact} className="text-body text-foreground-secondary">
          {fact}
        </p>
      ))}
    </div>
  );
}
