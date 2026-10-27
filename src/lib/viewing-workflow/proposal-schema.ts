import { z } from "zod";
import {
  ACCEPTANCE_BLOCKED_REASONS,
  CANCELLATION_ACTORS,
  PROPOSAL_RESOLUTIONS,
  PROPOSAL_TIMINGS,
  WORKFLOW_SIDES,
} from "./enums";

const instantSchema = z.iso.datetime();

export const proposalSchema = z.object({
  proposalId: z.string().min(1),
  round: z.number().int().nonnegative(),
  proposerSide: z.enum(WORKFLOW_SIDES),
  responderSide: z.enum(WORKFLOW_SIDES),
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
  message: z.string().nullable(),
  predecessorProposalId: z.string().min(1).nullable(),
  baseAppointmentId: z.string().min(1).nullable(),
  timing: z.enum(PROPOSAL_TIMINGS),
  shortNotice: z.boolean(),
  responseDeadlineAt: instantSchema.nullable(),
  acceptanceBlockedReason: z.enum(ACCEPTANCE_BLOCKED_REASONS).nullable(),
  resolution: z.enum(PROPOSAL_RESOLUTIONS),
  resolvedAt: instantSchema.nullable(),
  resolvedBy: z.enum(CANCELLATION_ACTORS).nullable(),
  effectiveResolution: z.enum(PROPOSAL_RESOLUTIONS),
});

export type ViewingProposal = z.infer<typeof proposalSchema>;
