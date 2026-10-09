import { z } from "zod";

export const APPLICATION_STATUSES = [
  "WAITING",
  "ACTIVE",
  "REJECTED",
  "WITHDRAWN",
  "ACCEPTED",
] as const;

const VIEWING_STATUSES = [
  "PROPOSED",
  "ACCEPTED",
  "DECLINED",
  "CHANGE_REQUESTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
  "SUPERSEDED",
] as const;

const VIEWING_NEXT_ACTIONS = [
  "APPLICANT_RESPOND_TO_VIEWING",
  "PROVIDER_RESPOND_TO_CHANGE_REQUEST",
  "PROVIDER_RECORD_VIEWING_OUTCOME",
  "APPLICANT_CONFIRM_POST_VIEWING_INTEREST",
  "PROVIDER_CLOSE_UNANSWERED_VIEWING",
  "NONE",
] as const;

const VIEWING_INTERESTS = ["STILL_INTERESTED", "NOT_INTERESTED"] as const;

export const DOCUMENT_TYPES = [
  "SCHUFA",
  "INCOME_PROOF",
  "IDENTITY_DOCUMENT",
  "LIABILITY_INSURANCE",
  "OTHER",
] as const;

export const dateTimeSchema = z.string().datetime();

function isSupportedTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const timeZoneSchema = z.string().min(1).refine(isSupportedTimeZone);

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const conversationSideSchema = z.enum(["PROVIDER", "APPLICANT"]);

export const compactListingSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable(),
  city: z.string().nullable(),
  coldRent: z.number().finite().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED", "RENTED"]),
  imageUrl: z.string().min(1).nullable(),
});

export const compactConversationSchema = z.object({
  isOpen: z.boolean(),
  isReadOnly: z.boolean(),
  expectedResponder: conversationSideSchema.nullable(),
  canCurrentUserSend: z.boolean(),
});

const viewingInterestResultSchema = z.object({
  interest: z.enum(VIEWING_INTERESTS),
  respondedAt: dateTimeSchema,
});

export const viewingCapabilitiesSchema = z.object({
  canAccept: z.boolean(),
  canDecline: z.boolean(),
  canRequestAnotherTime: z.boolean(),
  canSubmitInterest: z.boolean(),
});

const viewingSnapshotSchema = z.object({
  viewingId: z.string().min(1),
  status: z.enum(VIEWING_STATUSES),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  timeZone: timeZoneSchema,
  effectiveOutcome: z.enum(["COMPLETED", "NO_SHOW"]).nullable(),
  postViewingInterest: viewingInterestResultSchema.nullable(),
  nextAction: z.enum(VIEWING_NEXT_ACTIONS),
  capabilities: viewingCapabilitiesSchema,
});

export const viewingSummarySchema = z.object({
  current: viewingSnapshotSchema.nullable(),
  latest: viewingSnapshotSchema.nullable(),
  latestCompleted: viewingSnapshotSchema.nullable(),
  pendingInterest: viewingSnapshotSchema.nullable(),
  changeRequested: viewingSnapshotSchema.nullable(),
  canPropose: z.boolean(),
  nextAction: z.enum(VIEWING_NEXT_ACTIONS),
});

export const documentCountsSchema = z.object({
  requestedCount: z.number().int().nonnegative(),
  uploadRequiredCount: z.number().int().nonnegative(),
  reviewRequiredCount: z.number().int().nonnegative(),
  processingCount: z.number().int().nonnegative(),
  reviewedCount: z.number().int().nonnegative(),
});

export const readModelPaginationSchema = z.object({
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextCursor: z.string().min(1).nullable(),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];
export type ViewingInterest = (typeof VIEWING_INTERESTS)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type ViewingSnapshot = z.infer<typeof viewingSnapshotSchema>;
export type ViewingSummary = z.infer<typeof viewingSummarySchema>;
