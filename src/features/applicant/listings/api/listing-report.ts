import { z } from "zod";
import { apiPost } from "@/lib/api/client";

export const LISTING_REPORT_REASONS = [
  "MISLEADING_INFO",
  "SCAM_OR_FRAUD",
  "DISCRIMINATION",
  "INAPPROPRIATE_CONTENT",
  "DUPLICATE_OR_SPAM",
  "OTHER",
] as const;

export type ListingReportReason = (typeof LISTING_REPORT_REASONS)[number];

export const LISTING_REPORT_DETAIL_MAX = 500;

export type ListingReportPayload = {
  readonly reason: ListingReportReason;
  readonly detail?: string;
};

export type ListingReportPayloadError = "detail-required" | "detail-too-long";

export type ListingReportPayloadResult =
  | { readonly ok: true; readonly payload: ListingReportPayload }
  | { readonly ok: false; readonly code: ListingReportPayloadError };

const listingReportReasonSchema = z.enum(LISTING_REPORT_REASONS);

const listingReportDetailSchema = z
  .string()
  .min(1)
  .max(LISTING_REPORT_DETAIL_MAX);

const listingReportPayloadSchema = z.discriminatedUnion("reason", [
  z.object({
    reason: z.literal("OTHER"),
    detail: z.string().trim().min(1).max(LISTING_REPORT_DETAIL_MAX),
  }),
  z.object({
    reason: z.enum([
      "MISLEADING_INFO",
      "SCAM_OR_FRAUD",
      "DISCRIMINATION",
      "INAPPROPRIATE_CONTENT",
      "DUPLICATE_OR_SPAM",
    ]),
    detail: listingReportDetailSchema.optional(),
  }),
]);

const listingReportResponseSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  reason: listingReportReasonSchema,
  createdAt: z.string().datetime(),
});

export type ListingReport = z.infer<typeof listingReportResponseSchema>;

export class ListingReportContractError extends Error {
  constructor() {
    super("Invalid listing report response");
    this.name = "ListingReportContractError";
  }
}

export function buildListingReportPayload(
  reason: ListingReportReason,
  detail: string,
): ListingReportPayloadResult {
  const trimmed = detail.trim();

  if (trimmed.length > LISTING_REPORT_DETAIL_MAX) {
    return { ok: false, code: "detail-too-long" };
  }

  if (reason === "OTHER" && trimmed.length === 0) {
    return { ok: false, code: "detail-required" };
  }

  if (trimmed.length === 0) {
    return { ok: true, payload: { reason } };
  }

  return { ok: true, payload: { reason, detail: trimmed } };
}

export async function reportListing(
  listingId: string,
  payload: ListingReportPayload,
): Promise<ListingReport> {
  const parsedPayload = listingReportPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) throw new ListingReportContractError();

  const response = await apiPost<unknown>(
    `/api/v1/applicant/listings/${encodeURIComponent(listingId)}/report`,
    parsedPayload.data,
  );
  const parsed = listingReportResponseSchema.safeParse(response);
  if (!parsed.success) throw new ListingReportContractError();
  return parsed.data;
}
