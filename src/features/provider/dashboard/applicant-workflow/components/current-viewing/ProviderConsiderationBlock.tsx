"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { setProviderViewingConsideration } from "@/features/viewing-workflow/api/provider-workflow";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import type { WorkflowConsiderationInput } from "@/lib/viewing-workflow/command-schema";
import type {
  ViewingWorkflowProjection,
  WorkflowCapability,
} from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

type Commands = ReturnType<typeof useViewingCommands>;
type ProviderConsideration = WorkflowConsiderationInput["consideration"];

function recordedLine(
  consideration: NonNullable<
    ViewingWorkflowProjection["providerConsideration"]
  >,
): string | null {
  const recorded =
    consideration.decidedAt !== null || consideration.appointmentId !== null;
  if (!recorded && !consideration.decisionRequired) return null;
  if (consideration.state === "UNDECIDED") return copy.undecidedLine;
  if (consideration.state === "CONTINUE_CONSIDERING") return copy.continueLine;
  if (consideration.state === "DO_NOT_CONTINUE") return copy.stopLine;
  return null;
}

export function ProviderConsiderationBlock({
  applicationId,
  consideration,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly consideration: ViewingWorkflowProjection["providerConsideration"];
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const action = allowedCapability(capabilities, "SET_CONSIDERATION");
  const appointmentId = action?.target.appointmentId ?? null;
  const [confirmStop, setConfirmStop] = useState(false);
  if (!consideration && !appointmentId) return null;
  const busy = commands.pending !== null;
  const line = consideration ? recordedLine(consideration) : null;

  const send = (value: ProviderConsideration) => {
    if (!appointmentId) return;
    void commands.run("consideration", (input) =>
      setProviderViewingConsideration(applicationId, appointmentId, {
        ...input,
        consideration: value,
      }),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {line ? (
        <p className="text-body text-foreground-secondary">{line}</p>
      ) : null}
      {appointmentId && !confirmStop ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption font-medium text-foreground-secondary">
            {copy.considerationTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => send("CONTINUE_CONSIDERING")}
            >
              {copy.continue}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => send("UNDECIDED")}
            >
              {copy.undecided}
            </Button>
            <Button
              variant="dangerGhost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmStop(true)}
            >
              {copy.stop}
            </Button>
          </div>
        </div>
      ) : null}
      {confirmStop ? (
        <div className="flex flex-col gap-2">
          <p className="text-lead font-medium text-foreground">
            {copy.stopTitle}
          </p>
          <p className="text-body text-foreground-secondary">{copy.stopText}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmStop(false)}
            >
              {copy.back}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => send("DO_NOT_CONTINUE")}
            >
              {copy.confirmStop}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
