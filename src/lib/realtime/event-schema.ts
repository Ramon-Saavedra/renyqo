import { z } from "zod";

const envelope = {
  eventId: z.string().min(1),
  schemaVersion: z.literal(1),
  occurredAt: z.string().datetime(),
};

const conversationScope = {
  ...envelope,
  applicationId: z.string().min(1),
  conversationId: z.string().min(1),
};

const applicationScope = {
  ...envelope,
  applicationId: z.string().min(1),
};

export const domainEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...conversationScope,
    type: z.literal("conversation.message.created"),
    payload: z.strictObject({
      messageId: z.string().min(1),
      messageSequence: z.number().int().positive(),
    }),
  }),
  z.strictObject({
    ...conversationScope,
    type: z.literal("conversation.reply-permission.changed"),
    payload: z.strictObject({
      enabled: z.boolean(),
    }),
  }),
  z.strictObject({
    ...conversationScope,
    type: z.literal("conversation.read.advanced"),
    payload: z.strictObject({
      readerSide: z.enum(["APPLICANT", "PROVIDER"]),
      throughSequence: z.number().int().positive(),
      markedCount: z.number().int().nonnegative(),
    }),
  }),
  z.strictObject({
    ...applicationScope,
    type: z.literal("application.viewing.changed"),
    payload: z.strictObject({
      listingId: z.string().min(1),
      workflowId: z.string().min(1).nullish(),
      workflowRevision: z.number().int().positive().nullish(),
    }),
  }),
  z.strictObject({
    ...applicationScope,
    type: z.literal("application.lifecycle.changed"),
    payload: z.strictObject({
      listingId: z.string().min(1),
    }),
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("listing.applications.changed"),
    listingId: z.string().min(1),
    payload: z.strictObject({}),
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("notifications.changed"),
    userId: z.string().min(1),
    payload: z.strictObject({}),
  }),
]);

export type DomainEvent = z.infer<typeof domainEventSchema>;

export function parseDomainEvent(input: unknown): DomainEvent | null {
  const parsed = domainEventSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
