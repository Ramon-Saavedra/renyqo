import { z } from "zod";
import { apiGet } from "@/lib/api/client";
import { APPLICANT_INTRODUCTION_MAX_LENGTH } from "../types";

const providerApplicantSummarySchema = z.object({
  name: z.string(),
  peopleCount: z.number().int().nonnegative().nullable(),
  warnings: z.array(z.enum(["pets_by_arrangement", "smoking_by_arrangement"])),
  introduction: z.string().max(APPLICANT_INTRODUCTION_MAX_LENGTH).nullable(),
});

const providerActiveApplicationSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  status: z.literal("ACTIVE"),
  applicant: providerApplicantSummarySchema,
  activeAt: z.string().datetime().nullable(),
});

const providerActiveApplicationsResponseSchema = z
  .array(providerActiveApplicationSchema)
  .max(5);

const providerWaitingCountResponseSchema = z.object({
  waitingCount: z.number().int().min(0),
});

export type ProviderApplicantSummary = z.infer<
  typeof providerApplicantSummarySchema
>;
export type ProviderActiveApplication = z.infer<
  typeof providerActiveApplicationSchema
>;

export class ProviderListingApplicationsContractError extends Error {
  constructor() {
    super("Invalid provider listing applications response");
    this.name = "ProviderListingApplicationsContractError";
  }
}

export async function getProviderActiveApplications(
  listingId: string,
): Promise<readonly ProviderActiveApplication[]> {
  const response = await apiGet<unknown>(
    `/api/v1/provider/listings/${encodeURIComponent(listingId)}/active-applications`,
  );
  const parsed = providerActiveApplicationsResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ProviderListingApplicationsContractError();
  }
  if (
    !parsed.data.every((application) => application.listingId === listingId)
  ) {
    throw new ProviderListingApplicationsContractError();
  }
  return parsed.data;
}

export async function getProviderWaitingCount(
  listingId: string,
): Promise<number> {
  const response = await apiGet<unknown>(
    `/api/v1/provider/listings/${encodeURIComponent(listingId)}/waiting-count`,
  );
  const parsed = providerWaitingCountResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ProviderListingApplicationsContractError();
  }
  return parsed.data.waitingCount;
}
