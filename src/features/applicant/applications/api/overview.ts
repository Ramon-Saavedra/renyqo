import { z } from "zod";
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

const applicationCardSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  submittedAt: dateTimeSchema,
  activeAt: dateTimeSchema.nullable(),
  listing: compactListingSchema,
  attention: z.object({
    pendingActionCount: z.number().int().nonnegative(),
    actionableUnreadMessageCount: z.number().int().nonnegative(),
    hasPendingAction: z.boolean(),
  }),
  conversation: compactConversationSchema,
  documents: documentCountsSchema,
  viewing: viewingSummarySchema,
});

const overviewPageSchema = z.object({
  asOf: dateTimeSchema,
  items: z.array(applicationCardSchema),
  pagination: readModelPaginationSchema,
  totalCount: z.number().int().nonnegative(),
});

export type ApplicantApplicationCard = z.infer<typeof applicationCardSchema>;
export type ApplicantApplicationsPage = z.infer<typeof overviewPageSchema>;

export async function getApplicantApplicationsOverview(
  cursor: string | null,
  options?: ApiRequestOptions,
): Promise<ApplicantApplicationsPage> {
  const params = new URLSearchParams({ limit: String(OVERVIEW_PAGE_SIZE) });
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
