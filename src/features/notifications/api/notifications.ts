import { z } from "zod";
import { apiGet, apiPost, type ApiRequestOptions } from "@/lib/api/client";
import {
  notificationListSchema,
  notificationReadAllSchema,
  notificationReadSchema,
  notificationUnreadSchema,
  NOTIFICATION_CATEGORIES,
} from "./schema";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationList,
  NotificationUnread,
} from "./schema";

export class NotificationContractError extends Error {
  constructor(message = "Invalid notification contract") {
    super(message);
    this.name = "NotificationContractError";
  }
}

const limitSchema = z.number().int().min(1).max(100);
const instantSchema = z.iso.datetime();

export interface NotificationListQuery {
  readonly limit?: number;
  readonly category?: NotificationCategory;
  readonly beforeCreatedAt?: string;
  readonly beforeId?: string;
}

function notificationSearch(query: NotificationListQuery = {}): string {
  const limit = limitSchema.safeParse(query.limit ?? 25);
  if (!limit.success) {
    throw new NotificationContractError("Invalid notification query");
  }
  const hasCreatedAt = query.beforeCreatedAt !== undefined;
  const hasId = query.beforeId !== undefined;
  if (hasCreatedAt !== hasId) {
    throw new NotificationContractError("Invalid notification cursor");
  }
  const params = new URLSearchParams({ limit: String(limit.data) });
  if (query.category) {
    const category = z.enum(NOTIFICATION_CATEGORIES).safeParse(query.category);
    if (!category.success) {
      throw new NotificationContractError("Invalid notification category");
    }
    params.set("category", category.data);
  }
  if (query.beforeCreatedAt !== undefined && query.beforeId !== undefined) {
    const createdAt = instantSchema.safeParse(query.beforeCreatedAt);
    const id = z.string().min(1).safeParse(query.beforeId);
    if (!createdAt.success || !id.success) {
      throw new NotificationContractError("Invalid notification cursor");
    }
    params.set("beforeCreatedAt", createdAt.data);
    params.set("beforeId", id.data);
  }
  return params.toString();
}

async function readNotifications<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: ApiRequestOptions,
): Promise<T> {
  const response = await apiGet<unknown>(path, options);
  const parsed = schema.safeParse(response);
  if (!parsed.success) throw new NotificationContractError();
  return parsed.data;
}

export async function listNotifications(
  query?: NotificationListQuery,
  options?: ApiRequestOptions,
): Promise<NotificationList> {
  const search = notificationSearch(query);
  return readNotifications(
    `/api/v1/me/notifications?${search}`,
    notificationListSchema,
    options,
  );
}

export function getNotificationUnreadCount(
  options?: ApiRequestOptions,
): Promise<NotificationUnread> {
  return readNotifications(
    "/api/v1/me/notifications/unread-count",
    notificationUnreadSchema,
    options,
  );
}

export async function markNotificationRead(
  notificationId: string,
): Promise<Pick<NotificationItem, "id" | "readAt">> {
  const response = await apiPost<unknown>(
    `/api/v1/me/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
  );
  const parsed = notificationReadSchema.safeParse(response);
  if (!parsed.success) throw new NotificationContractError();
  return parsed.data;
}

export async function markAllNotificationsRead(
  throughCreatedAt: string,
): Promise<{ readonly markedCount: number }> {
  const cutoff = instantSchema.safeParse(throughCreatedAt);
  if (!cutoff.success) {
    throw new NotificationContractError("Invalid notification read cutoff");
  }
  const response = await apiPost<unknown>("/api/v1/me/notifications/read-all", {
    throughCreatedAt: cutoff.data,
  });
  const parsed = notificationReadAllSchema.safeParse(response);
  if (!parsed.success) throw new NotificationContractError();
  return parsed.data;
}
