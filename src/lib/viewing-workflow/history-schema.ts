import { z } from "zod";
import {
  ABSENCE_SIDES,
  APPOINTMENT_STATUSES,
  CANCELLATION_ACTORS,
  CANCELLATION_REASONS,
  INTEREST_STATES,
  SUBMITTED_INTERESTS,
  VIEWING_OUTCOMES,
} from "./enums";
import { proposalSchema } from "./proposal-schema";
import { workflowTargetSchema } from "./target-schema";

const instantSchema = z.iso.datetime();

const historyCancellationSchema = z.object({
  by: z.enum(CANCELLATION_ACTORS).nullable(),
  reason: z.enum(CANCELLATION_REASONS).nullable(),
  message: z.string().nullable(),
  late: z.boolean().nullable(),
});

const historyOutcomeSchema = z.object({
  revision: z.number().int().positive(),
  outcome: z.enum(VIEWING_OUTCOMES),
  absenceSide: z.enum(ABSENCE_SIDES).nullable(),
  correctionReason: z.string().nullable(),
  recordedAt: instantSchema,
});

const historyInterestSchema = z.object({
  storedState: z.enum(INTEREST_STATES).nullable(),
  state: z.enum(INTEREST_STATES),
  deadlineAt: instantSchema.nullable(),
  respondedAt: instantSchema.nullable(),
  interest: z.enum(SUBMITTED_INTERESTS).nullable(),
});

const historyAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(APPOINTMENT_STATUSES),
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
  acceptedAt: instantSchema.nullable(),
  cancelledAt: instantSchema.nullable(),
  supersededAt: instantSchema.nullable(),
  cancellation: historyCancellationSchema.nullable(),
  outcomes: z.array(historyOutcomeSchema),
  applicantInterest: historyInterestSchema.nullable(),
});

export const proposalHistoryItemSchema = proposalSchema.extend({
  applicationId: z.string().min(1),
  workflowId: z.string().min(1),
  target: workflowTargetSchema,
  appointment: historyAppointmentSchema.nullable(),
});

export const proposalHistoryPageSchema = z.object({
  asOf: instantSchema,
  applicationId: z.string().min(1),
  workflowId: z.string().min(1).nullable(),
  reconciliationRequired: z.boolean(),
  items: z.array(proposalHistoryItemSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    hasMore: z.boolean(),
    nextBeforeRound: z.number().int().nonnegative().nullable(),
  }),
});

export type ProposalHistoryItem = z.infer<typeof proposalHistoryItemSchema>;
export type ProposalHistoryPage = z.infer<typeof proposalHistoryPageSchema>;
