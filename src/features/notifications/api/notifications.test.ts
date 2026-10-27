import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api/client";
import {
  getNotificationUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationContractError,
} from "./notifications";
import { notificationListSchema } from "./schema";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const AT = "2026-10-26T08:00:00.000Z";

const notification = {
  id: "notification-1",
  type: "VIEWING_PROPOSED",
  category: "VIEWING" as const,
  schemaVersion: 1 as const,
  occurredAt: AT,
  createdAt: AT,
  readAt: null,
  expiresAt: "2027-01-24T08:00:00.000Z",
  target: {
    applicationId: "application-1",
    listingId: "listing-1",
    workflowId: "workflow-1",
    proposalId: "proposal-1",
    appointmentId: null,
    section: "VIEWING" as const,
    activityId: "activity-1",
    action: "OPEN_HISTORY" as const,
  },
};

describe("notification contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses a viewing notification without a command target", () => {
    expect(
      notificationListSchema.parse({
        schemaVersion: 1,
        asOf: AT,
        items: [notification],
        unreadCount: 2,
        nextRevalidateAt: null,
        nextCursor: null,
      }).items[0]?.target.action,
    ).toBe("OPEN_HISTORY");
  });

  it("filters by category and keeps the unread count request separate", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      schemaVersion: 1,
      asOf: AT,
      items: [notification],
      unreadCount: 4,
      nextRevalidateAt: null,
      nextCursor: { beforeCreatedAt: AT, beforeId: "notification-1" },
    });
    const page = await listNotifications({ category: "VIEWING", limit: 25 });
    expect(page.unreadCount).toBe(4);
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/me/notifications?limit=25&category=VIEWING",
      undefined,
    );

    vi.mocked(apiGet).mockResolvedValueOnce({
      asOf: AT,
      unreadCount: 4,
      nextRevalidateAt: null,
    });
    await getNotificationUnreadCount();
    expect(apiGet).toHaveBeenLastCalledWith(
      "/api/v1/me/notifications/unread-count",
      undefined,
    );
  });

  it("rejects a partial cursor before calling the API", async () => {
    await expect(
      listNotifications({ beforeCreatedAt: AT }),
    ).rejects.toBeInstanceOf(NotificationContractError);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("marks one notification and all notifications through the list time", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({
      id: "notification-1",
      readAt: AT,
    });
    await markNotificationRead("notification-1");
    vi.mocked(apiPost).mockResolvedValueOnce({ markedCount: 3 });
    await expect(markAllNotificationsRead(AT)).resolves.toEqual({
      markedCount: 3,
    });
    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      "/api/v1/me/notifications/notification-1/read",
      {},
    );
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      "/api/v1/me/notifications/read-all",
      { throughCreatedAt: AT },
    );
  });
});
