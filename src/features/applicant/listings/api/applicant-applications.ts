import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";

const applicantApplicationSchema = z.object({
  id: z.string().min(1),
  listingId: z.string().min(1),
  status: z.enum(["ACTIVE", "WAITING", "WITHDRAWN", "REJECTED", "ACCEPTED"]),
  rejectedAt: z.string().datetime().nullable(),
  publicReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  listing: z.object({
    title: z.string().nullable(),
    city: z.string().nullable(),
    coldRent: z.number().finite().nullable(),
    imageUrl: z.string().nullable(),
  }),
});

const applicantApplicationsSchema = z.array(applicantApplicationSchema);

export type ApplicantListingApplication = z.infer<typeof applicantApplicationSchema>;

export class ApplicantApplicationsContractError extends Error {
  constructor() {
    super("Invalid applicant applications response");
    this.name = "ApplicantApplicationsContractError";
  }
}

export async function getApplicantApplications(
  options?: ApiRequestOptions,
): Promise<readonly ApplicantListingApplication[]> {
  const response = await apiGet<unknown>("/api/v1/applicant/applications", options);
  const parsed = applicantApplicationsSchema.safeParse(response);
  if (!parsed.success) throw new ApplicantApplicationsContractError();
  return parsed.data;
}
