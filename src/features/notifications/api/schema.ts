import { z } from "zod";

const instantSchema = z.iso.datetime();

export const NOTIFICATION_CATEGORIES = [
  "APPLICATION",
  "VIEWING",
  "DOCUMENTS",
] as const;

export const notificationTargetSchema = z.object({
  applicationId: z.string().min(1),
  listingId: z.string().min(1),
  workflowId: z.string().min(1).nullable(),
  proposalId: z.string().min(1).nullable(),
  appointmentId: z.string().min(1).nullable(),
  section: z.enum(["VIEWING", "APPLICATION"]),
  activityId: z.string().min(1),
  action: z.literal("OPEN_HISTORY"),
});

export const notificationSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  category: z.enum(NOTIFICATION_CATEGORIES),
  schemaVersion: z.literal(1),
  occurredAt: instantSchema,
  createdAt: instantSchema,
  readAt: instantSchema.nullable(),
  expiresAt: instantSchema,
  target: notificationTargetSchema,
});

export const notificationCursorSchema = z.object({
  beforeCreatedAt: instantSchema,
  beforeId: z.string().min(1),
});

export const notificationListSchema = z.object({
  schemaVersion: z.literal(1),
  asOf: instantSchema,
  items: z.array(notificationSchema),
  unreadCount: z.number().int().nonnegative(),
  nextRevalidateAt: instantSchema.nullable(),
  nextCursor: notificationCursorSchema.nullable(),
});

export const notificationUnreadSchema = z.object({
  asOf: instantSchema,
  unreadCount: z.number().int().nonnegative(),
  nextRevalidateAt: instantSchema.nullable(),
});

export const notificationReadSchema = z.object({
  id: z.string().min(1),
  readAt: instantSchema,
});

export const notificationReadAllSchema = z.object({
  markedCount: z.number().int().nonnegative(),
});

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type NotificationItem = z.infer<typeof notificationSchema>;
export type NotificationList = z.infer<typeof notificationListSchema>;
export type NotificationUnread = z.infer<typeof notificationUnreadSchema>;
