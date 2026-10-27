"use client";

import { useCallback, useState } from "react";
import type {
  WorkflowCommandInput,
  WorkflowCommandResult,
} from "@/lib/viewing-workflow/command-schema";
import { commitViewingCommand } from "@/features/viewing-workflow/snapshot/command";
import type { ViewingSide } from "@/features/viewing-workflow/snapshot/owner";
import { viewingScheduleErrorMessage } from "./schedule-error";

export type ViewingCommandStatus =
  | "success"
  | "stale"
  | "short-notice"
  | "error";

export function useViewingCommands(
  applicationId: string,
  side: ViewingSide,
  workflowRevision: number,
  onChanged: () => void,
) {
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<"stale" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(
    async (
      kind: string,
      command: (input: WorkflowCommandInput) => Promise<WorkflowCommandResult>,
    ): Promise<ViewingCommandStatus> => {
      setPending(kind);
      setNotice(null);
      setErrorMessage(null);
      const input: WorkflowCommandInput = {
        requestKey: crypto.randomUUID(),
        expectedWorkflowRevision: workflowRevision,
      };
      const outcome = await commitViewingCommand(applicationId, side, () =>
        command(input),
      );
      setPending(null);
      if (outcome.status === "success") {
        onChanged();
        return "success";
      }
      if (
        outcome.status === "conflict" &&
        outcome.failure?.kind === "state-changed"
      ) {
        setNotice("stale");
        onChanged();
        return "stale";
      }
      if (outcome.failure?.kind === "short-notice-required") {
        return "short-notice";
      }
      if (kind === "schedule") {
        setErrorMessage(viewingScheduleErrorMessage(outcome.error));
      }
      setNotice("error");
      return "error";
    },
    [applicationId, onChanged, side, workflowRevision],
  );

  return { pending, notice, errorMessage, run };
}
