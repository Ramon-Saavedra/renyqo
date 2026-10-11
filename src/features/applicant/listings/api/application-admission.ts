import { z } from "zod";

export const applicationSubmissionBlockReasonSchema = z.enum([
  "AUTHENTICATION_REQUIRED",
  "LISTING_NOT_ACCEPTING_APPLICATIONS",
  "CURRENT_APPLICATION_EXISTS",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REAPPLICATION_COOLDOWN",
  "APPLICATION_HISTORY_REQUIRES_REVIEW",
  "LISTING_RENTED",
  "APPLICANT_NOT_ELIGIBLE",
]);

export const applicationAdmissionSchema = z.object({
  hasApplicationHistory: z.boolean(),
  currentApplicationId: z.string().min(1).nullable(),
  currentApplicationStatus: z
    .enum(["ACTIVE", "WAITING", "REJECTED", "WITHDRAWN", "ACCEPTED"])
    .nullable(),
  canSubmitApplication: z.boolean(),
  submissionBlockReason: applicationSubmissionBlockReasonSchema.nullable(),
  reapplyAvailableAt: z.iso.datetime().nullable(),
});

export type ApplicationAdmission = z.infer<typeof applicationAdmissionSchema>;
export type ApplicationSubmissionBlockReason = z.infer<
  typeof applicationSubmissionBlockReasonSchema
>;
