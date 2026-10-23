import { z } from "zod";

const sharedEventFields = {
  eventId: z.string().min(1),
  schemaVersion: z.literal(1),
  occurredAt: z.string().datetime(),
  applicationId: z.string().min(1),
  conversationId: z.string().min(1),
};

export const domainEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...sharedEventFields,
    type: z.literal("conversation.message.created"),
    payload: z.strictObject({
      messageId: z.string().min(1),
      messageSequence: z.number().int().positive(),
    }),
  }),
  z.strictObject({
    ...sharedEventFields,
    type: z.literal("conversation.reply-permission.changed"),
    payload: z.strictObject({
      enabled: z.boolean(),
    }),
  }),
  z.strictObject({
    ...sharedEventFields,
    type: z.literal("conversation.read.advanced"),
    payload: z.strictObject({
      readerSide: z.enum(["APPLICANT", "PROVIDER"]),
      throughSequence: z.number().int().positive(),
      markedCount: z.number().int().nonnegative(),
    }),
  }),
]);

export type DomainEvent = z.infer<typeof domainEventSchema>;

export function parseDomainEvent(input: unknown): DomainEvent | null {
  const parsed = domainEventSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
