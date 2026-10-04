import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import { activityItemSchema, WorkspaceContractError } from "./workspace";

const activityPageSchema = z.object({
  asOf: z.string().datetime(),
  items: z.array(activityItemSchema).max(100),
  pagination: z.object({
    hasMore: z.boolean(),
    limit: z.number().int().positive(),
    nextCursor: z.string().min(1).nullable(),
  }),
  totalCount: z.number().int().nonnegative(),
});

export type ActivityPageItem = z.infer<typeof activityItemSchema>;
export type ActivityPage = z.infer<typeof activityPageSchema>;

export async function getActivityPage(
  applicationId: string,
  cursor: string | null,
  limit = 20,
  options?: ApiRequestOptions,
): Promise<ActivityPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const response = await apiGet<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/activity?${params.toString()}`,
    options,
  );
  const parsed = activityPageSchema.safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
  return parsed.data;
}
