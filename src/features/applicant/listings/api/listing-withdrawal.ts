import { z } from "zod";
import { apiDelete } from "@/lib/api/client";

const withdrawnApplicationSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  status: z.literal("WITHDRAWN"),
  rejectedAt: z.string().datetime().nullable(),
  publicReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WithdrawnListingApplication = z.infer<typeof withdrawnApplicationSchema>;

export class ListingWithdrawalContractError extends Error {
  constructor() {
    super("Invalid listing withdrawal response");
    this.name = "ListingWithdrawalContractError";
  }
}

export async function withdrawListingApplication(
  applicationId: string,
): Promise<WithdrawnListingApplication> {
  const response = await apiDelete<unknown>(
    `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}`,
  );
  const parsed = withdrawnApplicationSchema.safeParse(response);
  if (!parsed.success) throw new ListingWithdrawalContractError();
  return parsed.data;
}
