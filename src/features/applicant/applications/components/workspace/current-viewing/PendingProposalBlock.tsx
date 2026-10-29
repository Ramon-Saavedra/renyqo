import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import {
  acceptApplicantProposal,
  rejectApplicantProposal,
  withdrawApplicantAlternative,
} from "@/features/viewing-workflow/api/applicant-workflow";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { formatDateTime } from "../../../model/format-date";
import { allowedCapability } from "../../../model/viewing-capability";
import { AppointmentWhen } from "./AppointmentWhen";
import { currentViewingCopy as copy } from "./copy";
import type { useApplicantViewingCommands } from "./useApplicantViewingCommands";

type Commands = ReturnType<typeof useApplicantViewingCommands>;

export function PendingProposalBlock({
  applicationId,
  proposal,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly proposal: NonNullable<ViewingWorkflowProjection["pendingProposal"]>;
  readonly capabilities: ViewingWorkflowProjection["capabilities"];
  readonly commands: Commands;
}) {
  const [rejecting, setRejecting] = useState(false);
  const accept = allowedCapability(capabilities, "ACCEPT_PROPOSAL");
  const reject = allowedCapability(capabilities, "REJECT_PROPOSAL");
  const withdraw = allowedCapability(capabilities, "WITHDRAW_ALTERNATIVE");
  const busy = commands.pending !== null;
  const acceptId = accept?.target.proposalId ?? null;
  const rejectId = reject?.target.proposalId ?? null;
  const withdrawId = withdraw?.target.proposalId ?? null;

  return (
    <article
      data-proposal-id={proposal.proposalId}
      className="flex flex-col gap-3 rounded-md border border-border bg-background-muted px-3 py-3.5"
    >
      <div>
        <h3 className="text-caption font-semibold text-foreground">
          {proposal.baseAppointmentId ? copy.replacement : copy.newProposal}
        </h3>
        <p className="mt-1 text-caption text-foreground-secondary">
          {proposal.proposerSide === "APPLICANT"
            ? copy.fromYou
            : copy.fromProvider}
        </p>
      </div>
      <AppointmentWhen
        startsAt={proposal.startsAt}
        endsAt={proposal.endsAt}
        timeZone={proposal.timeZone}
      />
      {proposal.responseDeadlineAt ? (
        <p className="text-body text-foreground-secondary">
          {copy.deadline(
            formatDateTime(proposal.responseDeadlineAt, proposal.timeZone),
          )}
        </p>
      ) : null}
      {proposal.shortNotice ? (
        <p className="text-caption text-foreground-secondary">
          {copy.shortNotice}
        </p>
      ) : null}
      {proposal.message ? (
        <p className="text-body whitespace-pre-wrap text-foreground">
          {proposal.message}
        </p>
      ) : null}
      {rejecting ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-lead font-medium text-foreground">
            {copy.rejectTitle}
          </p>
          <p className="text-body text-foreground-secondary">
            {copy.rejectText}
          </p>
          <div className="flex flex-wrap gap-2">
            {rejectId ? (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => {
                  void commands
                    .run("reject", (input) =>
                      rejectApplicantProposal(applicationId, rejectId, input),
                    )
                    .then((status) => {
                      if (status === "success") setRejecting(false);
                    });
                }}
              >
                {commands.pending === "reject"
                  ? copy.sending
                  : copy.confirmReject}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="md"
              disabled={busy}
              onClick={() => setRejecting(false)}
            >
              {copy.back}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {acceptId ? (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                void commands.run("accept", (input) =>
                  acceptApplicantProposal(applicationId, acceptId, input),
                );
              }}
            >
              {commands.pending === "accept" ? copy.sending : copy.accept}
            </Button>
          ) : null}
          {rejectId ? (
            <Button
              variant="dangerGhost"
              size="md"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              {copy.reject}
            </Button>
          ) : null}
          {withdrawId ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                void commands.run("withdraw", (input) =>
                  withdrawApplicantAlternative(
                    applicationId,
                    withdrawId,
                    input,
                  ),
                );
              }}
            >
              {commands.pending === "withdraw" ? copy.sending : copy.withdraw}
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
