import { z } from "zod";
import { ApiError, apiPost } from "@/lib/api/client";
import { listingEligibilitySchema, type ListingEligibility } from "./listing-eligibility";

const applicationSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  applicantId: z.string().min(1),
  status: z.enum(["ACTIVE", "WAITING"]),
  rejectedAt: z.null(),
  publicReason: z.null(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ListingApplication = z.infer<typeof applicationSchema>;

export class ListingApplicationContractError extends Error {
  constructor() {
    super("Invalid listing application response");
    this.name = "ListingApplicationContractError";
  }
}

export class ListingEligibilityRejectedError extends Error {
  readonly eligibility: ListingEligibility;

  constructor(eligibility: ListingEligibility) {
    super("Applicant is not eligible for this listing");
    this.name = "ListingEligibilityRejectedError";
    this.eligibility = eligibility;
  }
}

export async function applyToListing(id: string): Promise<ListingApplication> {
  try {
    const response = await apiPost<unknown>(
      `/api/v1/listings/${encodeURIComponent(id)}/apply`,
      {},
    );
    const parsed = applicationSchema.safeParse(response);
    if (!parsed.success) throw new ListingApplicationContractError();
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      const parsed = listingEligibilitySchema.safeParse(error.details);
      if (parsed.success && parsed.data.canApply === false) {
        throw new ListingEligibilityRejectedError(parsed.data);
      }
    }
    throw error;
  }
}
