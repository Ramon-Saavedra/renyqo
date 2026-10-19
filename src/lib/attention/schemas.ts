import { z } from "zod";

export const ATTENTION_SECTIONS = ["MESSAGES", "DOCUMENTS", "VIEWING"] as const;

export const DOCUMENT_ATTENTION_STATUSES = [
  "UPLOAD_REQUIRED",
  "RECEIVED",
] as const;

export const APPLICATION_DOCUMENT_TYPES = [
  "SCHUFA",
  "INCOME_PROOF",
  "IDENTITY_DOCUMENT",
  "LIABILITY_INSURANCE",
  "OTHER",
] as const;

const dateTimeSchema = z.string().datetime();

export const attentionCategoryTotalsSchema = z.object({
  documentUploadCount: z.number().int().nonnegative(),
  documentReviewCount: z.number().int().nonnegative(),
  viewingActionCount: z.number().int().nonnegative(),
});

export const attentionTargetSchema = z.object({
  applicationId: z.string().min(1),
  listingId: z.string().min(1),
  section: z.enum(ATTENTION_SECTIONS),
  requestId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  viewingId: z.string().min(1).optional(),
});

export const documentAttentionIndicatorSchema = z.object({
  requestId: z.string().min(1),
  type: z.enum(APPLICATION_DOCUMENT_TYPES),
  customLabel: z.string().nullable(),
  status: z.enum(DOCUMENT_ATTENTION_STATUSES),
  documentId: z.string().min(1).optional(),
});

export const applicationAttentionSummarySchema = z.object({
  pendingActionCount: z.number().int().nonnegative(),
  hasPendingAction: z.boolean(),
  actionableUnreadMessageCount: z.number().int().nonnegative(),
  categories: attentionCategoryTotalsSchema,
  targets: z.array(attentionTargetSchema),
  documentIndicators: z.array(documentAttentionIndicatorSchema),
  nextRevalidateAt: dateTimeSchema.nullable(),
});

export const applicantListingAttentionSchema =
  applicationAttentionSummarySchema.extend({
    applicationId: z.string().min(1),
  });

export const attentionTotalsSchema = z.object({
  applicationsWithPendingActions: z.number().int().nonnegative(),
  totalPendingActions: z.number().int().nonnegative(),
  actionableUnreadMessageCount: z.number().int().nonnegative(),
  categories: attentionCategoryTotalsSchema,
  nextRevalidateAt: dateTimeSchema.nullable(),
});

export const applicationAttentionListItemSchema =
  applicationAttentionSummarySchema.extend({
    applicationId: z.string().min(1),
    listingId: z.string().min(1),
    listingTitle: z.string().nullable(),
    listingCity: z.string().nullable(),
  });

export const listingAttentionTotalsSchema = attentionTotalsSchema.extend({
  listingId: z.string().min(1),
});

export const attentionPaginationSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  totalApplications: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const attentionAggregateResponseSchema = z.object({
  asOf: dateTimeSchema,
  totals: attentionTotalsSchema,
  listings: z.array(listingAttentionTotalsSchema),
  items: z.array(applicationAttentionListItemSchema),
  pagination: attentionPaginationSchema,
});
