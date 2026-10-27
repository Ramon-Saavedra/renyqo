import { z } from "zod";
import {
  ABSENCE_SIDES,
  APPOINTMENT_STATUSES,
  CANCELLATION_ACTORS,
  CANCELLATION_REASONS,
  CAPABILITY_ACTIONS,
  CLOSURE_REASONS,
  INTEREST_STATES,
  MUTATION_BLOCKED_REASONS,
  OBLIGATION_ACTIONS,
  PROPOSAL_TIMINGS,
  PROVIDER_CONSIDERATIONS,
  VIEWING_OUTCOMES,
  WORKFLOW_MODES,
  WORKFLOW_SIDES,
  WORKFLOW_STATES,
} from "./enums";
import { proposalSchema } from "./proposal-schema";
import { workflowTargetSchema } from "./target-schema";

const instantSchema = z.iso.datetime();

const cancellationSchema = z.object({
  cancelledAt: instantSchema.nullable(),
  by: z.enum(CANCELLATION_ACTORS).nullable(),
  reason: z.enum(CANCELLATION_REASONS).nullable(),
  message: z.string().nullable(),
  late: z.boolean().nullable(),
});

export const workflowAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(APPOINTMENT_STATUSES),
  proposalId: z.string().min(1).nullable(),
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
  cancellation: cancellationSchema.nullable(),
});

const confirmedAppointmentSchema = workflowAppointmentSchema.extend({
  timing: z.enum(PROPOSAL_TIMINGS).nullable(),
  shortNotice: z.boolean().nullable(),
});

const outcomeSchema = z.object({
  appointmentId: z.string().min(1),
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
  outcome: z.enum(VIEWING_OUTCOMES),
  absenceSide: z.enum(ABSENCE_SIDES).nullable(),
  revision: z.number().int().positive(),
  recordedAt: instantSchema,
  correctionCutoffAt: instantSchema.nullable(),
});

const applicantInterestSchema = z.object({
  appointmentId: z.string().min(1),
  state: z.enum(INTEREST_STATES),
  storedState: z.enum(INTEREST_STATES).nullable(),
  deadlineAt: instantSchema.nullable(),
  respondedAt: instantSchema.nullable(),
  lifecycleExpiryPending: z.boolean(),
});

const providerConsiderationSchema = z.object({
  state: z.enum(PROVIDER_CONSIDERATIONS),
  decidedAt: instantSchema.nullable(),
  appointmentId: z.string().min(1).nullable(),
  decisionRequired: z.boolean(),
});

const closureSchema = z.object({
  state: z.enum(WORKFLOW_STATES),
  reason: z.enum(CLOSURE_REASONS).nullable(),
  closedAt: instantSchema.nullable(),
});

export const workflowObligationSchema = z.object({
  action: z.enum(OBLIGATION_ACTIONS),
  responsibleSide: z.enum(WORKFLOW_SIDES),
  deadlineAt: instantSchema.nullable(),
  target: workflowTargetSchema,
});

export const workflowCapabilitySchema = z.object({
  action: z.enum(CAPABILITY_ACTIONS),
  allowed: z.boolean(),
  blockedReason: z.string().nullable(),
  target: workflowTargetSchema,
});

export const viewingWorkflowProjectionSchema = z.object({
  applicationId: z.string().min(1),
  workflowId: z.string().min(1).nullable(),
  workflowRevision: z.number().int().nonnegative(),
  mode: z.enum(WORKFLOW_MODES),
  reconciliationRequired: z.boolean(),
  asOf: instantSchema,
  confirmedAppointment: confirmedAppointmentSchema.nullable(),
  pendingProposal: proposalSchema.nullable(),
  latestProposal: proposalSchema.nullable(),
  latestAppointment: workflowAppointmentSchema.nullable(),
  changeCutoffAt: instantSchema.nullable(),
  outcome: outcomeSchema.nullable(),
  applicantInterest: applicantInterestSchema.nullable(),
  providerConsideration: providerConsiderationSchema.nullable(),
  closure: closureSchema.nullable(),
  obligations: z.array(workflowObligationSchema),
  nextObligation: workflowObligationSchema.nullable(),
  capabilities: z.array(workflowCapabilitySchema),
  nextRevalidateAt: instantSchema.nullable(),
});

const postViewingSchema = z.object({
  appointmentId: z.string().min(1),
  interestState: z.enum(INTEREST_STATES).nullable(),
  interestDeadlineAt: instantSchema.nullable(),
  providerConsideration: z.enum(PROVIDER_CONSIDERATIONS).optional(),
  interestResponseBlockedReason: z.string().nullable().optional(),
});

/** Standalone GET /viewing-workflow body. Embedded summaries omit the last three fields. */
export const viewingWorkflowSnapshotSchema =
  viewingWorkflowProjectionSchema.extend({
    state: z.enum(WORKFLOW_STATES).nullable(),
    mutationsBlockedReason: z.enum(MUTATION_BLOCKED_REASONS).nullable(),
    postViewing: postViewingSchema.nullable(),
  });

export type ViewingWorkflowProjection = z.infer<
  typeof viewingWorkflowProjectionSchema
>;
export type ViewingWorkflowSnapshot = z.infer<
  typeof viewingWorkflowSnapshotSchema
>;
export type WorkflowObligation = z.infer<typeof workflowObligationSchema>;
export type WorkflowCapability = z.infer<typeof workflowCapabilitySchema>;
