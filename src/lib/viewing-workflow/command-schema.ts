import { z } from "zod";
import {
  ABSENCE_SIDES,
  PROVIDER_CLOSE_REASONS,
  PROVIDER_CONSIDERATIONS,
  SUBMITTED_INTERESTS,
  VIEWING_OUTCOMES,
} from "./enums";

const REQUEST_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OFFSET_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const requestKeySchema = z.string().regex(REQUEST_KEY);
export const workflowRevisionSchema = z
  .number()
  .int()
  .min(0)
  .max(2_147_483_646);

const optionalMessageSchema = z.string().min(1).max(500).optional();

export const workflowCommandSchema = z.object({
  requestKey: requestKeySchema,
  expectedWorkflowRevision: workflowRevisionSchema,
});

export const workflowScheduleSchema = workflowCommandSchema.extend({
  startsAt: z.string().regex(OFFSET_INSTANT),
  endsAt: z.string().regex(OFFSET_INSTANT),
  timeZone: z.string().min(1).max(100),
  message: optionalMessageSchema,
  shortNotice: z.boolean().optional(),
});

export const workflowCancelSchema = workflowCommandSchema.extend({
  message: optionalMessageSchema,
});

export const workflowCloseSchema = workflowCancelSchema.extend({
  reason: z.enum(PROVIDER_CLOSE_REASONS),
  proposalId: z.string().min(1).nullable(),
  appointmentId: z.string().min(1).nullable(),
});

export const workflowInterestSchema = z.discriminatedUnion("interest", [
  workflowCommandSchema.extend({
    interest: z.literal(SUBMITTED_INTERESTS[0]),
  }),
  workflowCommandSchema.extend({
    interest: z.literal(SUBMITTED_INTERESTS[1]),
    confirmWithdrawal: z.literal(true),
  }),
]);

export const workflowConsiderationSchema = workflowCommandSchema.extend({
  consideration: z.enum(PROVIDER_CONSIDERATIONS),
});

export const workflowOutcomeSchema = workflowCommandSchema
  .extend({
    outcome: z.enum(VIEWING_OUTCOMES),
    absenceSide: z.enum(ABSENCE_SIDES).optional(),
    correctionReason: z.string().min(1).max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.outcome === "COMPLETED" && value.absenceSide !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["absenceSide"],
        message: "COMPLETED omits absenceSide",
      });
    }
    if (value.outcome === "NO_SHOW" && value.absenceSide === undefined) {
      context.addIssue({
        code: "custom",
        path: ["absenceSide"],
        message: "NO_SHOW requires absenceSide",
      });
    }
  });

export const workflowCommandResultSchema = z.object({
  applicationId: z.string().min(1),
  workflowId: z.string().min(1).nullable(),
  workflowRevision: z.number().int().nonnegative(),
  proposalId: z.string().min(1).nullable(),
  appointmentId: z.string().min(1).nullable(),
});

export type WorkflowCommandInput = z.infer<typeof workflowCommandSchema>;
export type WorkflowScheduleInput = z.infer<typeof workflowScheduleSchema>;
export type WorkflowCancelInput = z.infer<typeof workflowCancelSchema>;
export type WorkflowCloseInput = z.infer<typeof workflowCloseSchema>;
export type WorkflowInterestInput = z.infer<typeof workflowInterestSchema>;
export type WorkflowConsiderationInput = z.infer<
  typeof workflowConsiderationSchema
>;
export type WorkflowOutcomeInput = z.infer<typeof workflowOutcomeSchema>;
export type WorkflowCommandResult = z.infer<typeof workflowCommandResultSchema>;
