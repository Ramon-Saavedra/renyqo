import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import { activityItemSchema } from "./activity-schema";
import {
  ApplicantApplicationContractError,
  ApplicantApplicationNotFoundError,
  isNotFoundResponse,
} from "./errors";
import {
  DOCUMENT_TYPES,
  applicationStatusSchema,
  compactConversationSchema,
  compactListingSchema,
  conversationSideSchema,
  dateTimeSchema,
  documentCountsSchema,
  viewingSummarySchema,
} from "./shared-schemas";

const pendingActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("RESPOND_TO_MESSAGE"),
    source: z.literal("CONVERSATION"),
  }),
  z.object({
    type: z.literal("UPLOAD_REQUESTED_DOCUMENT"),
    source: z.literal("DOCUMENT"),
    target: z.object({ requestId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("RESPOND_TO_VIEWING"),
    source: z.literal("VIEWING"),
    target: z.object({ viewingId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("CONFIRM_POST_VIEWING_INTEREST"),
    source: z.literal("VIEWING"),
    target: z.object({ viewingId: z.string().min(1) }),
  }),
]);

const documentRequestSnapshotSchema = z.object({
  requestId: z.string().min(1),
  type: z.enum(DOCUMENT_TYPES),
  customLabel: z.string().nullable(),
  status: z.enum(["UPLOAD_REQUIRED", "PROCESSING", "RECEIVED", "REVIEWED"]),
  documentId: z.string().min(1).nullable(),
  canDownload: z.boolean(),
  canUpload: z.boolean(),
});

const workspaceSchema = z.object({
  asOf: dateTimeSchema,
  listing: compactListingSchema,
  application: z.object({
    id: z.string().min(1),
    status: applicationStatusSchema,
    submittedAt: dateTimeSchema,
    activeAt: dateTimeSchema.nullable(),
    rejectedAt: dateTimeSchema.nullable(),
    withdrawnAt: dateTimeSchema.nullable(),
    publicReason: z
      .enum(["NOT_SELECTED", "LISTING_RENTED", "PROFILE_NO_LONGER_ELIGIBLE"])
      .nullable(),
  }),
  attention: z.object({
    pendingActions: z.array(pendingActionSchema),
    pendingActionCount: z.number().int().nonnegative(),
    hasPendingAction: z.boolean(),
    actionableUnreadMessageCount: z.number().int().nonnegative(),
    historicalUnreadMessageCount: z.number().int().nonnegative(),
    conversation: z.object({
      isOpen: z.boolean(),
      isReadOnly: z.boolean(),
      expectedResponder: conversationSideSchema.nullable(),
    }),
  }),
  conversationSummary: compactConversationSchema,
  documentsSummary: z.object({
    counts: documentCountsSchema,
    currentRequests: z.array(documentRequestSnapshotSchema),
  }),
  viewingSummary: viewingSummarySchema,
  activityPreview: z.object({
    items: z.array(activityItemSchema).max(5),
    hasMore: z.boolean(),
  }),
  capabilities: z.object({
    canWithdraw: z.boolean(),
  }),
});

export type ApplicantWorkspace = z.infer<typeof workspaceSchema>;
export type ApplicantPendingAction = z.infer<typeof pendingActionSchema>;
export type WorkspaceDocumentRequest = z.infer<
  typeof documentRequestSnapshotSchema
>;
export function parseApplicantWorkspace(
  value: unknown,
  applicationId: string,
): ApplicantWorkspace {
  const parsed = workspaceSchema.safeParse(value);
  if (!parsed.success || parsed.data.application.id !== applicationId) {
    throw new ApplicantApplicationContractError();
  }
  return parsed.data;
}

export async function getApplicantWorkspace(
  applicationId: string,
  options?: ApiRequestOptions,
): Promise<ApplicantWorkspace> {
  try {
    const response = await apiGet<unknown>(
      `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}/workspace`,
      options,
    );
    return parseApplicantWorkspace(response, applicationId);
  } catch (error) {
    if (isNotFoundResponse(error))
      throw new ApplicantApplicationNotFoundError();
    throw error;
  }
}
