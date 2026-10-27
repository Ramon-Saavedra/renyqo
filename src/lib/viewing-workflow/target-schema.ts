import { z } from "zod";

export const workflowTargetSchema = z.object({
  applicationId: z.string().min(1),
  workflowId: z.string().min(1).nullable(),
  proposalId: z.string().min(1).nullable(),
  appointmentId: z.string().min(1).nullable(),
  section: z.literal("VIEWING"),
  action: z.string().min(1),
});

export type WorkflowTarget = z.infer<typeof workflowTargetSchema>;
