import { z } from "zod";
export const conversationCapabilitiesSchema = z.object({
  applicantRepliesEnabled: z.boolean(),
  canCurrentUserSend: z.boolean(),
  canCurrentUserManageApplicantReplies: z.boolean(),
  sendBlockReason: z
    .enum(["LIFECYCLE_READ_ONLY", "APPLICANT_REPLIES_DISABLED"])
    .nullable(),
});
export const conversationSummarySchema = conversationCapabilitiesSchema.extend({
  hasMessages: z.boolean(),
});
export type ConversationCapabilities = z.infer<
  typeof conversationCapabilitiesSchema
>;
