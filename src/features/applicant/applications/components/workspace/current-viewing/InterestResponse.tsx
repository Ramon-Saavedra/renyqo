import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { submitApplicantViewingInterest } from "@/features/viewing-workflow/api/applicant-workflow";
import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { formatDateTime } from "../../../model/format-date";
import { allowedCapability } from "../../../model/viewing-capability";
import { currentViewingCopy as copy } from "./copy";
import {
  postViewingInterestObligation,
  readOnlyInterestText,
} from "./renderable-interest";
import type { useApplicantViewingCommands } from "./useApplicantViewingCommands";

export function InterestResponse({
  applicationId,
  projection,
  commands,
}: {
  readonly applicationId: string;
  readonly projection: ViewingWorkflowProjection;
  readonly commands: ReturnType<typeof useApplicantViewingCommands>;
}) {
  const [confirming, setConfirming] = useState(false);
  const capability = allowedCapability(
    projection.capabilities,
    "SUBMIT_INTEREST",
  );
  const appointmentId = capability?.target.appointmentId ?? null;
  const obligation = postViewingInterestObligation(projection);
  const deadline =
    projection.applicantInterest?.deadlineAt ?? obligation?.deadlineAt ?? null;
  const timeZone =
    projection.outcome?.timeZone ??
    projection.confirmedAppointment?.timeZone ??
    "Europe/Berlin";
  const quiet = readOnlyInterestText(projection.applicantInterest);
  if (!appointmentId && !quiet && !obligation) return null;
  const busy = commands.pending !== null;

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border px-3 py-3.5">
      {appointmentId && !confirming ? (
        <h3 className="text-caption font-semibold text-foreground">
          {copy.interestTitle}
        </h3>
      ) : null}
      {deadline ? (
        <p className="text-body text-foreground-secondary">
          {copy.interestDeadline(formatDateTime(deadline, timeZone))}
        </p>
      ) : null}
      {appointmentId ? (
        confirming ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-lead font-medium text-foreground">
              {copy.withdrawalTitle}
            </p>
            <p className="text-body text-foreground-secondary">
              {copy.withdrawalText}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => {
                  void commands
                    .run("interest-no", (input) =>
                      submitApplicantViewingInterest(
                        applicationId,
                        appointmentId,
                        {
                          ...input,
                          interest: "NOT_INTERESTED",
                          confirmWithdrawal: true,
                        },
                      ),
                    )
                    .then((status) => {
                      if (status === "success") setConfirming(false);
                    });
                }}
              >
                {commands.pending === "interest-no"
                  ? copy.sending
                  : copy.confirmWithdrawal}
              </Button>
              <Button
                variant="ghost"
                size="md"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                {copy.back}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                void commands.run("interest-yes", (input) =>
                  submitApplicantViewingInterest(applicationId, appointmentId, {
                    ...input,
                    interest: "STILL_INTERESTED",
                  }),
                );
              }}
            >
              {commands.pending === "interest-yes"
                ? copy.sending
                : copy.stillInterested}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              {copy.notInterested}
            </Button>
          </div>
        )
      ) : quiet ? (
        <p className="text-body text-foreground-secondary">{quiet}</p>
      ) : obligation ? (
        <p className="text-body text-foreground-secondary">
          {copy.interestPending}
        </p>
      ) : null}
    </div>
  );
}
