import { ApiError } from "@/lib/api/client";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";
import {
  parseViewingCommandFailure,
  type ViewingCommandFailure,
} from "@/lib/viewing-workflow/errors";
import { refetchViewingSnapshot, type ViewingSide } from "./owner";

export type ViewingCommandCommit =
  | { readonly status: "success"; readonly result: WorkflowCommandResult }
  | {
      readonly status: "conflict";
      readonly failure: ViewingCommandFailure | null;
      readonly error: unknown;
    }
  | {
      readonly status: "error";
      readonly failure: ViewingCommandFailure | null;
      readonly error: unknown;
    };

function isConflict(
  error: unknown,
  failure: ViewingCommandFailure | null,
): boolean {
  if (failure?.kind === "state-changed") return true;
  if (failure?.kind === "idempotency-key-reused") return true;
  return error instanceof ApiError && error.status === 409;
}

/**
 * Runs one CURRENT command. The caller owns requestKey.
 * Success and 409 refetch the snapshot. The command is not called again.
 */
export async function commitViewingCommand(
  applicationId: string,
  side: ViewingSide,
  command: () => Promise<WorkflowCommandResult>,
): Promise<ViewingCommandCommit> {
  try {
    const result = await command();
    await refetchViewingSnapshot(applicationId, side);
    return { status: "success", result };
  } catch (error) {
    const failure = parseViewingCommandFailure(error);
    if (!isConflict(error, failure)) {
      return { status: "error", failure, error };
    }
    await refetchViewingSnapshot(applicationId, side);
    return { status: "conflict", failure, error };
  }
}
