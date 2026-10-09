import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import { activityItemSchema } from "./activity-schema";
import { ApplicantApplicationContractError } from "./errors";
import { dateTimeSchema, readModelPaginationSchema } from "./shared-schemas";

const ACTIVITY_PAGE_SIZE = 20;

const activityPageSchema = z.object({
  asOf: dateTimeSchema,
  items: z.array(activityItemSchema).max(100),
  pagination: readModelPaginationSchema,
  totalCount: z.number().int().nonnegative(),
});

export type ActivityPage = z.infer<typeof activityPageSchema>;

export async function getApplicantActivityPage(
  applicationId: string,
  cursor: string | null,
  options?: ApiRequestOptions,
): Promise<ActivityPage> {
  const params = new URLSearchParams({ limit: String(ACTIVITY_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  const response = await apiGet<unknown>(
    `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}/activity?${params.toString()}`,
    options,
  );
  const parsed = activityPageSchema.safeParse(response);
  if (!parsed.success) throw new ApplicantApplicationContractError();
  if (parsed.data.pagination.hasMore && !parsed.data.pagination.nextCursor) {
    throw new ApplicantApplicationContractError();
  }
  return parsed.data;
}
