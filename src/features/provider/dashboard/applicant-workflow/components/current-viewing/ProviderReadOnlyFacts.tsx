"use client";

import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

export function ProviderReadOnlyFacts({
  projection,
}: {
  readonly projection: ViewingWorkflowProjection;
}) {
  const latest = projection.latestAppointment;
  const cancelled =
    projection.confirmedAppointment === null &&
    latest !== null &&
    (latest.status === "CANCELLED" || latest.cancellation !== null);
  const expired =
    projection.pendingProposal === null &&
    projection.latestProposal?.effectiveResolution === "EXPIRED";
  const closed = projection.closure?.state === "CLOSED";
  if (!cancelled && !expired && !closed) return null;
  return (
    <div className="flex flex-col gap-1 text-body text-foreground-secondary">
      {cancelled ? <p>{copy.cancelledFact}</p> : null}
      {expired ? <p>{copy.expiredProposal}</p> : null}
      {closed ? <p>{copy.closed}</p> : null}
    </div>
  );
}
