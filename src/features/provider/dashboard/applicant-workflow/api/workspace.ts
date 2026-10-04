import { z } from "zod";
import { ApiError, apiGet, type ApiRequestOptions } from "@/lib/api/client";

const PROVIDER_PENDING_ACTIONS = [
  "RESPOND_TO_MESSAGE",
  "REVIEW_DOCUMENT",
  "RESPOND_TO_VIEWING_CHANGE_REQUEST",
  "CLOSE_UNANSWERED_VIEWING",
  "RECORD_VIEWING_OUTCOME",
] as const;

const DOCUMENT_REQUEST_STATUSES = [
  "UPLOAD_REQUIRED",
  "PROCESSING",
  "RECEIVED",
  "REVIEWED",
] as const;

const ACTIVITY_TYPES = [
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

const DOCUMENT_TYPES = [
  "SCHUFA",
  "INCOME_PROOF",
  "IDENTITY_DOCUMENT",
  "LIABILITY_INSURANCE",
  "OTHER",
] as const;

const dateTimeSchema = z.string().datetime();

const viewingCapabilitiesSchema = z.object({
  canReschedule: z.boolean(),
  canCancel: z.boolean(),
  canMarkCompleted: z.boolean(),
  canMarkNoShow: z.boolean(),
  canCorrectOutcome: z.boolean(),
});

const viewingSchema = z.object({
  viewingId: z.string().min(1),
  status: z.string().min(1),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  timeZone: z.string().min(1),
  effectiveOutcome: z.string().nullable(),
  postViewingInterest: z.string().nullable(),
  nextAction: z.string().nullable(),
  capabilities: viewingCapabilitiesSchema,
});

const documentRequestSchema = z.object({
  requestId: z.string().min(1),
  type: z.string().min(1),
  customLabel: z.string().nullable(),
  status: z.enum(DOCUMENT_REQUEST_STATUSES),
  documentId: z.string().min(1).nullable(),
  canDownload: z.boolean(),
  canReview: z.boolean(),
  canCancel: z.boolean(),
  canRequestReplacement: z.boolean(),
});

const activityPayloadSchema = z.object({
  viewingId: z.string().min(1).optional(),
  viewingRound: z.number().int().nonnegative().optional(),
  previousViewingId: z.string().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  outcomeRevision: z.number().int().nonnegative().optional(),
  requestId: z.string().min(1).optional(),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  initialStatus: z.string().min(1).optional(),
  fromStatus: z.string().min(1).optional(),
  toStatus: z.string().min(1).optional(),
});

export const activityItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  actorType: z.enum(["PROVIDER", "APPLICANT", "SYSTEM"]),
  occurredAt: dateTimeSchema,
  payload: activityPayloadSchema.nullable(),
});

const conversationStateSchema = z.object({
  expectedResponder: z.enum(["PROVIDER", "APPLICANT"]).nullable(),
  isOpen: z.boolean(),
  isReadOnly: z.boolean(),
});

export const applicantWorkspaceSchema = z.object({
  application: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
    submittedAt: dateTimeSchema.nullable(),
    activeAt: dateTimeSchema.nullable(),
    rejectedAt: dateTimeSchema.nullable(),
    withdrawnAt: dateTimeSchema.nullable(),
    publicReason: z.string().nullable(),
  }),
  applicant: z.object({
    name: z.string().min(1),
    peopleCount: z.number().int().nonnegative().nullable(),
    introduction: z.string().nullable(),
  }),
  capabilities: z.object({
    canReject: z.boolean(),
    canSelectForRental: z.boolean(),
    canRestore: z.boolean(),
  }),
  asOf: dateTimeSchema,
  attention: z.object({
    pendingActions: z.array(z.enum(PROVIDER_PENDING_ACTIONS)),
    pendingActionCount: z.number().int().nonnegative(),
    hasPendingAction: z.boolean(),
    actionableUnreadMessageCount: z.number().int().nonnegative(),
    historicalUnreadMessageCount: z.number().int().nonnegative(),
    conversation: conversationStateSchema,
  }),
  conversationSummary: conversationStateSchema.extend({
    canCurrentUserSend: z.boolean(),
  }),
  documentsSummary: z.object({
    canRequestDocuments: z.boolean(),
    counts: z.object({
      processingCount: z.number().int().nonnegative(),
      requestedCount: z.number().int().nonnegative(),
      reviewRequiredCount: z.number().int().nonnegative(),
      reviewedCount: z.number().int().nonnegative(),
      uploadRequiredCount: z.number().int().nonnegative(),
    }),
    currentRequests: z.array(documentRequestSchema),
  }),
  viewingSummary: z.object({
    current: viewingSchema.nullable(),
    latest: viewingSchema.nullable(),
    latestCompleted: viewingSchema.nullable(),
    pendingInterest: viewingSchema.nullable(),
    changeRequested: viewingSchema.nullable(),
    canPropose: z.boolean(),
    nextAction: z.string().min(1),
  }),
  activityPreview: z.object({
    items: z.array(activityItemSchema).max(5),
    hasMore: z.boolean(),
  }),
});

export type ApplicantWorkspace = z.infer<typeof applicantWorkspaceSchema>;
export type WorkspaceDocumentRequest = z.infer<typeof documentRequestSchema>;
export type WorkspaceViewing = z.infer<typeof viewingSchema>;
export type WorkspaceActivityItem = z.infer<typeof activityItemSchema>;
export type ProviderPendingAction = (typeof PROVIDER_PENDING_ACTIONS)[number];

export class WorkspaceContractError extends Error {
  constructor() {
    super("Invalid applicant workspace response");
    this.name = "WorkspaceContractError";
  }
}

export class WorkspaceInaccessibleError extends Error {
  constructor() {
    super("Applicant workspace is not accessible");
    this.name = "WorkspaceInaccessibleError";
  }
}

export function parseApplicantWorkspace(
  value: unknown,
  applicationId: string,
): ApplicantWorkspace {
  const parsed = applicantWorkspaceSchema.safeParse(value);
  if (!parsed.success) throw new WorkspaceContractError();
  if (parsed.data.application.id !== applicationId) {
    throw new WorkspaceContractError();
  }
  if (parsed.data.application.status === "WAITING") {
    throw new WorkspaceInaccessibleError();
  }
  return parsed.data;
}

export async function getApplicantWorkspace(
  applicationId: string,
  options?: ApiRequestOptions,
): Promise<ApplicantWorkspace> {
  try {
    const response = await apiGet<unknown>(
      `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/workspace`,
      options,
    );
    return parseApplicantWorkspace(response, applicationId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new WorkspaceInaccessibleError();
    }
    throw error;
  }
}
