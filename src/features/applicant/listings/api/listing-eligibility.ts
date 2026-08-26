import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";

export const eligibilityReasonSchema = z.enum([
  "household_income_not_available",
  "household_income_below_requirement",
  "schufa_required_but_not_available",
  "income_proof_required_but_not_available",
  "household_size_not_available",
  "household_size_exceeds_requirement",
  "pets_not_allowed",
  "smoking_not_allowed",
]);

export const eligibilityWarningSchema = z.enum([
  "pets_by_arrangement",
  "smoking_by_arrangement",
]);

export const listingEligibilitySchema = z.object({
  canApply: z.boolean(),
  reasons: z.array(eligibilityReasonSchema),
  warnings: z.array(eligibilityWarningSchema),
  evaluatedAt: z.string().datetime(),
});

export type ListingEligibility = z.infer<typeof listingEligibilitySchema>;
export type EligibilityReason = z.infer<typeof eligibilityReasonSchema>;
export type EligibilityWarning = z.infer<typeof eligibilityWarningSchema>;

export class ListingEligibilityContractError extends Error {
  constructor() {
    super("Invalid listing eligibility response");
    this.name = "ListingEligibilityContractError";
  }
}

export async function getListingEligibility(
  id: string,
  options?: ApiRequestOptions,
): Promise<ListingEligibility> {
  const response = await apiGet<unknown>(
    `/api/v1/listings/${encodeURIComponent(id)}/eligibility`,
    options,
  );
  const parsed = listingEligibilitySchema.safeParse(response);
  if (!parsed.success) throw new ListingEligibilityContractError();
  return parsed.data;
}
