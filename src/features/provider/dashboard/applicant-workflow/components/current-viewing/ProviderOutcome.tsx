"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { recordProviderViewingOutcome } from "@/features/viewing-workflow/api/provider-workflow";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import type { WorkflowOutcomeInput } from "@/lib/viewing-workflow/command-schema";
import type {
  ViewingWorkflowProjection,
  WorkflowCapability,
} from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

type Commands = ReturnType<typeof useViewingCommands>;
type ViewingOutcome = WorkflowOutcomeInput["outcome"];
type AbsenceSide = NonNullable<WorkflowOutcomeInput["absenceSide"]>;

function outcomeLine(
  outcome: ViewingWorkflowProjection["outcome"],
): string | null {
  if (!outcome) return null;
  if (outcome.outcome === "COMPLETED") return copy.outcomeCompleted;
  if (outcome.absenceSide === "APPLICANT") return copy.outcomeApplicant;
  if (outcome.absenceSide === "PROVIDER") return copy.outcomeProvider;
  if (outcome.absenceSide === "BOTH") return copy.outcomeBoth;
  return copy.outcomeRecorded;
}

export function ProviderOutcome({
  applicationId,
  outcome,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly outcome: ViewingWorkflowProjection["outcome"];
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const correct = allowedCapability(capabilities, "CORRECT_OUTCOME");
  const record = allowedCapability(capabilities, "RECORD_OUTCOME");
  const action = correct?.target.appointmentId
    ? correct
    : record?.target.appointmentId
      ? record
      : null;
  const [choice, setChoice] = useState<
    "COMPLETED" | "APPLICANT" | "PROVIDER" | "BOTH" | null
  >(null);
  const [reason, setReason] = useState("");
  const line = outcomeLine(outcome);
  const correcting = action?.action === "CORRECT_OUTCOME";
  const busy = commands.pending !== null;
  const reasonReady = !correcting || reason.trim().length > 0;
  if (!line && !action) return null;

  const submit = () => {
    const appointmentId = action?.target.appointmentId;
    if (!appointmentId || !choice || !reasonReady) return;
    const trimmed = reason.trim();
    const outcomeValue: ViewingOutcome =
      choice === "COMPLETED" ? "COMPLETED" : "NO_SHOW";
    const absenceSide: AbsenceSide | null =
      choice === "APPLICANT"
        ? "APPLICANT"
        : choice === "PROVIDER"
          ? "PROVIDER"
          : choice === "BOTH"
            ? "BOTH"
            : null;
    void commands.run("outcome", (input) =>
      recordProviderViewingOutcome(applicationId, appointmentId, {
        ...input,
        outcome: outcomeValue,
        ...(absenceSide ? { absenceSide } : {}),
        ...(correcting ? { correctionReason: trimmed } : {}),
      }),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {line ? (
        <p
          className={
            outcome?.outcome === "NO_SHOW" &&
            outcome.absenceSide === "APPLICANT"
              ? "text-caption text-warning"
              : "text-body text-foreground-secondary"
          }
        >
          {line}
        </p>
      ) : null}
      {action ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption font-medium text-foreground-secondary">
            {copy.outcomeTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={choice === "COMPLETED" ? "primary" : "outline"}
              aria-pressed={choice === "COMPLETED"}
              size="sm"
              disabled={busy}
              onClick={() => setChoice("COMPLETED")}
            >
              {copy.completed}
            </Button>
            <Button
              variant={choice === "APPLICANT" ? "outline" : "ghost"}
              aria-pressed={choice === "APPLICANT"}
              size="sm"
              className={choice === "APPLICANT" ? "text-warning" : undefined}
              disabled={busy}
              onClick={() => setChoice("APPLICANT")}
            >
              {copy.applicantAbsent}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setChoice("PROVIDER")}
              aria-pressed={choice === "PROVIDER"}
            >
              {copy.providerAbsent}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setChoice("BOTH")}
              aria-pressed={choice === "BOTH"}
            >
              {copy.bothAbsent}
            </Button>
          </div>
          {correcting ? (
            <Textarea
              rows={2}
              maxLength={500}
              value={reason}
              aria-label={copy.correctionReason}
              onChange={(event) => setReason(event.target.value)}
            />
          ) : null}
          <Button
            variant="primary"
            size="sm"
            disabled={busy || choice === null || !reasonReady}
            onClick={submit}
          >
            {commands.pending === "outcome"
              ? copy.sending
              : correcting
                ? copy.saveCorrection
                : copy.saveOutcome}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
