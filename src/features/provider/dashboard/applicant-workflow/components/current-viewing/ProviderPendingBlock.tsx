"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { AppointmentWhen } from "@/features/applicant/applications/components/workspace/current-viewing/AppointmentWhen";
import { formatDateTime } from "@/features/applicant/applications/model/format-date";
import {
  acceptProviderProposal,
  rejectProviderProposal,
} from "@/features/viewing-workflow/api/provider-workflow";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import type { ViewingProposal } from "@/lib/viewing-workflow/proposal-schema";
import { providerViewingCopy as copy } from "./copy";

type Commands = ReturnType<typeof useViewingCommands>;

export function ProviderPendingBlock({
  applicationId,
  proposal,
  confirmed,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly proposal: ViewingProposal;
  readonly confirmed: boolean;
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const [rejecting, setRejecting] = useState(false);
  const accept = allowedCapability(capabilities, "ACCEPT_PROPOSAL");
  const reject = allowedCapability(capabilities, "REJECT_PROPOSAL");
  const busy = commands.pending !== null;
  const heading = proposal.baseAppointmentId
    ? copy.replacement
    : copy.newProposal;

  return (
    <article
      data-proposal-id={proposal.proposalId}
      className="flex flex-col gap-2 rounded-md border border-border bg-background-muted px-2.5 py-3.5 sm:px-3.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-lead font-medium text-foreground">{heading}</h4>
        <p className="text-caption text-foreground-secondary">
          {proposal.proposerSide === "APPLICANT"
            ? copy.fromApplicant
            : copy.fromYou}
        </p>
      </div>
      <AppointmentWhen
        startsAt={proposal.startsAt}
        endsAt={proposal.endsAt}
        timeZone={proposal.timeZone}
      />
      {proposal.message ? (
        <p className="text-body text-foreground">{proposal.message}</p>
      ) : null}
      {proposal.responseDeadlineAt ? (
        <p className="text-caption text-foreground-secondary">
          {copy.deadline(formatDateTime(proposal.responseDeadlineAt))}
        </p>
      ) : null}
      {proposal.shortNotice ? (
        <p className="text-caption text-foreground-secondary">
          {copy.shortNotice}
        </p>
      ) : null}
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <p className="text-lead font-medium text-foreground">
            {copy.rejectTitle}
          </p>
          <p className="text-body text-foreground-secondary">
            {confirmed ? copy.rejectKeepsConfirmed : copy.rejectText}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setRejecting(false)}
            >
              {copy.back}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={busy || !reject?.target.proposalId}
              onClick={() => {
                const proposalId = reject?.target.proposalId;
                if (!proposalId) return;
                void commands.run("reject", (input) =>
                  rejectProviderProposal(applicationId, proposalId, input),
                );
              }}
            >
              {copy.confirmReject}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {accept?.target.proposalId ? (
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
                const proposalId = accept.target.proposalId;
                if (!proposalId) return;
                void commands.run("accept", (input) =>
                  acceptProviderProposal(applicationId, proposalId, input),
                );
              }}
            >
              {copy.accept}
            </Button>
          ) : null}
          {reject?.target.proposalId ? (
            <Button
              variant="dangerGhost"
              size="sm"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              {copy.reject}
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
