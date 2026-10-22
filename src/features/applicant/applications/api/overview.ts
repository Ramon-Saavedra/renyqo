import { z } from "zod";
import { applicationAttentionSummarySchema } from "@/lib/attention/schemas";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import { ApplicantApplicationContractError } from "./errors";
import {
  applicationStatusSchema,
  compactConversationSchema,
  compactListingSchema,
  dateTimeSchema,
  documentCountsSchema,
  readModelPaginationSchema,
  viewingSummarySchema,
} from "./shared-schemas";

const OVERVIEW_PAGE_SIZE = 20;

export const APPLICANT_OVERVIEW_GROUPS = [
  "ALL",
  "ACTIVE",
  "WAITING",
  "DONE",
] as const;

export type ApplicantOverviewGroup = (typeof APPLICANT_OVERVIEW_GROUPS)[number];

const applicationCardSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  submittedAt: dateTimeSchema,
  activeAt: dateTimeSchema.nullable(),
  rejectedAt: dateTimeSchema.nullable(),
  withdrawnAt: dateTimeSchema.nullable(),
  listing: compactListingSchema,
  attention: applicationAttentionSummarySchema,
  conversation: compactConversationSchema,
  documents: documentCountsSchema,
  viewing: viewingSummarySchema,
});

const overviewCountsSchema = z.object({
  all: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
});

const overviewPageSchema = z.object({
  asOf: dateTimeSchema,
  items: z.array(applicationCardSchema),
  pagination: readModelPaginationSchema,
  totalCount: z.number().int().nonnegative(),
  counts: overviewCountsSchema,
});

export type ApplicantApplicationCard = z.infer<typeof applicationCardSchema>;
export type ApplicantApplicationsPage = z.infer<typeof overviewPageSchema>;

export async function getApplicantApplicationsOverview(
  cursor: string | null,
  group: ApplicantOverviewGroup,
  options?: ApiRequestOptions,
): Promise<ApplicantApplicationsPage> {
  const params = new URLSearchParams({
    limit: String(OVERVIEW_PAGE_SIZE),
    group,
  });
  if (cursor) params.set("cursor", cursor);
  const response = await apiGet<unknown>(
    `/api/v1/applicant/applications/overview?${params.toString()}`,
    options,
  );
  const parsed = overviewPageSchema.safeParse(response);
  if (!parsed.success) throw new ApplicantApplicationContractError();
  if (parsed.data.pagination.hasMore && !parsed.data.pagination.nextCursor) {
    throw new ApplicantApplicationContractError();
  }
  return parsed.data;
}
