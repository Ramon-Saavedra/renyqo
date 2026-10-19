import type { z } from "zod";
import type {
  applicantListingAttentionSchema,
  applicationAttentionListItemSchema,
  applicationAttentionSummarySchema,
  attentionAggregateResponseSchema,
  attentionCategoryTotalsSchema,
  attentionPaginationSchema,
  attentionTargetSchema,
  attentionTotalsSchema,
  documentAttentionIndicatorSchema,
  listingAttentionTotalsSchema,
} from "./schemas";

export type AttentionCategoryTotals = z.infer<
  typeof attentionCategoryTotalsSchema
>;
export type AttentionTarget = z.infer<typeof attentionTargetSchema>;
export type DocumentAttentionIndicator = z.infer<
  typeof documentAttentionIndicatorSchema
>;
export type ApplicationAttentionSummary = z.infer<
  typeof applicationAttentionSummarySchema
>;
export type ApplicantListingAttention = z.infer<
  typeof applicantListingAttentionSchema
>;
export type AttentionTotals = z.infer<typeof attentionTotalsSchema>;
export type ApplicationAttentionListItem = z.infer<
  typeof applicationAttentionListItemSchema
>;
export type ListingAttentionTotals = z.infer<
  typeof listingAttentionTotalsSchema
>;
export type AttentionPagination = z.infer<typeof attentionPaginationSchema>;
export type AttentionAggregateResponse = z.infer<
  typeof attentionAggregateResponseSchema
>;
export type ApplicationDocumentType = DocumentAttentionIndicator["type"];
