import { z } from "zod";
import { apiGet } from "@/lib/api/client";

const providerExitedApplicationStatusSchema = z.enum(["WITHDRAWN", "REJECTED"]);

const providerExitedApplicationPublicReasonSchema = z
  .enum(["NOT_SELECTED", "PROFILE_NO_LONGER_ELIGIBLE", "LISTING_RENTED"])
  .nullable();

const providerExitedApplicationSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  applicantName: z.string().min(1),
  status: providerExitedApplicationStatusSchema,
  publicReason: providerExitedApplicationPublicReasonSchema,
  exitedAt: z.string().datetime(),
});

const providerExitedApplicationsResponseSchema = z
  .object({
    items: z.array(providerExitedApplicationSchema).max(5),
    totalCount: z.number().int().nonnegative(),
  })
  .refine(({ items, totalCount }) => totalCount >= items.length);

export type ProviderExitedApplicationsResponse = z.infer<
  typeof providerExitedApplicationsResponseSchema
>;

export type ProviderExitedApplicationStatus = z.infer<
  typeof providerExitedApplicationStatusSchema
>;
export type ProviderExitedApplicationPublicReason = z.infer<
  typeof providerExitedApplicationPublicReasonSchema
>;
export type ProviderExitedApplication = z.infer<
  typeof providerExitedApplicationSchema
>;

export class ProviderExitedApplicationsContractError extends Error {
  constructor() {
    super("Invalid provider exited applications response");
    this.name = "ProviderExitedApplicationsContractError";
  }
}

export async function getProviderExitedApplications(
  listingId: string,
): Promise<ProviderExitedApplicationsResponse> {
  const response = await apiGet<unknown>(
    `/api/v1/provider/listings/${encodeURIComponent(listingId)}/exited-applications`,
  );
  const parsed = providerExitedApplicationsResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ProviderExitedApplicationsContractError();
  }
  if (
    !parsed.data.items.every(
      (application) => application.listingId === listingId,
    )
  ) {
    throw new ProviderExitedApplicationsContractError();
  }
  return parsed.data;
}
