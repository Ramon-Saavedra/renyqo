import { z } from "zod";
import {
  APPLICATION_STATUSES,
  DOCUMENT_TYPES,
  dateTimeSchema,
} from "./shared-schemas";

export const ACTIVITY_TYPES = [
  "VIEWING_PROPOSED",
  "VIEWING_ACCEPTED",
  "VIEWING_DECLINED",
  "VIEWING_CHANGE_REQUESTED",
  "VIEWING_RESCHEDULED",
  "VIEWING_CANCELLED",
  "VIEWING_COMPLETED",
  "VIEWING_NO_SHOW",
  "VIEWING_OUTCOME_CORRECTED",
  "VIEWING_INTEREST_CONFIRMED",
  "VIEWING_INTEREST_DECLINED",
  "APPLICATION_SUBMITTED",
  "APPLICATION_PROMOTED_TO_ACTIVE",
  "APPLICATION_WITHDRAWN",
  "APPLICATION_REJECTED",
  "APPLICATION_RESTORED",
  "APPLICATION_ACCEPTED",
  "CONVERSATION_OPENED",
  "MESSAGE_SENT",
  "DOCUMENT_REQUESTED",
  "DOCUMENT_REQUEST_CANCELLED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_REVIEWED",
] as const;

const activityPayloadSchema = z.object({
  viewingId: z.string().min(1).optional(),
  previousViewingId: z.string().min(1).optional(),
  viewingRound: z.number().int().positive().optional(),
  outcomeRevision: z.number().int().positive().optional(),
  startsAt: dateTimeSchema.optional(),
  endsAt: dateTimeSchema.optional(),
  requestId: z.string().min(1).optional(),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  initialStatus: z.enum(APPLICATION_STATUSES).optional(),
  fromStatus: z.enum(APPLICATION_STATUSES).optional(),
  toStatus: z.enum(APPLICATION_STATUSES).optional(),
});

export const activityItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  actorType: z.enum(["PROVIDER", "APPLICANT", "SYSTEM"]),
  occurredAt: dateTimeSchema,
  payload: activityPayloadSchema.nullable(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type ActivityType = ActivityItem["type"];
