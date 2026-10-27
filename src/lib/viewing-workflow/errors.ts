import { z } from "zod";
import { ApiError } from "@/lib/api/client";

const stateChangedSchema = z.object({
  code: z.literal("VIEWING_STATE_CHANGED"),
  applicationId: z.string().min(1),
  reason: z.string().min(1),
  currentWorkflowRevision: z.number().int().nonnegative(),
});

const idempotencySchema = z.object({
  code: z.literal("VIEWING_IDEMPOTENCY_KEY_REUSED"),
});

const shortNoticeSchema = z.object({
  code: z.literal("VIEWING_SHORT_NOTICE_REQUIRED"),
});

export type ViewingCommandFailure =
  | {
      readonly kind: "state-changed";
      readonly applicationId: string;
      readonly reason: string;
      readonly currentWorkflowRevision: number;
    }
  | { readonly kind: "idempotency-key-reused" }
  | { readonly kind: "short-notice-required" };

export function parseViewingCommandFailure(
  error: unknown,
): ViewingCommandFailure | null {
  if (!(error instanceof ApiError) || error.kind !== "http") return null;
  if (error.status === 409) {
    const state = stateChangedSchema.safeParse(error.details);
    if (state.success) {
      return {
        kind: "state-changed",
        applicationId: state.data.applicationId,
        reason: state.data.reason,
        currentWorkflowRevision: state.data.currentWorkflowRevision,
      };
    }
    if (idempotencySchema.safeParse(error.details).success) {
      return { kind: "idempotency-key-reused" };
    }
    return null;
  }
  if (
    error.status === 400 &&
    shortNoticeSchema.safeParse(error.details).success
  ) {
    return { kind: "short-notice-required" };
  }
  return null;
}
