import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetRealtimeSchedules,
  scheduleConversationMessage,
  scheduleNotificationsChanged,
} from "@/lib/realtime/attention";
import { formatDateTime } from "@/features/applicant/applications/model/format-date";
import type { NotificationItem, NotificationList } from "../api/schema";
import { notificationCopy } from "../copy";
import { NotificationBell } from "./NotificationBell";
import { NotificationInbox } from "./NotificationInbox";

const getNotificationUnreadCount = vi.hoisted(() => vi.fn());
const listNotifications = vi.hoisted(() => vi.fn());
const markNotificationRead = vi.hoisted(() => vi.fn());
const markAllNotificationsRead = vi.hoisted(() => vi.fn());
const selectDashboardListing = vi.hoisted(() => vi.fn());

vi.mock("../api/notifications", () => ({
  getNotificationUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
}));

vi.mock("@/features/provider/dashboard/selected-object-storage", () => ({
  selectDashboardListing,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const AT = "2026-10-26T08:00:00.000Z";
const OLDER = "2026-10-26T07:00:00.000Z";

function notification(
  overrides: Partial<NotificationItem> & Pick<NotificationItem, "id" | "type">,
): NotificationItem {
  const { target, ...rest } = overrides;
  return {
    category: "VIEWING",
    schemaVersion: 1,
    occurredAt: AT,
    createdAt: AT,
    readAt: null,
    expiresAt: "2027-01-24T08:00:00.000Z",
    ...rest,
    target: {
      applicationId: "application-1",
      listingId: "listing-1",
      workflowId: null,
      proposalId: null,
      appointmentId: null,
      section: "VIEWING",
      activityId: `${overrides.id}-activity`,
      action: "OPEN_HISTORY",
      ...target,
    },
  };
}

function page(
  items: readonly NotificationItem[],
  nextCursor: NotificationList["nextCursor"] = null,
): NotificationList {
  return {
    schemaVersion: 1,
    asOf: AT,
    items: [...items],
    unreadCount: 99,
    nextRevalidateAt: null,
    nextCursor,
  };
}

const viewing = notification({
  id: "notification-1",
  type: "VIEWING_PROPOSED",
  category: "VIEWING",
});
const application = notification({
  id: "notification-2",
  type: "APPLICATION_REJECTED",
  category: "APPLICATION",
  readAt: AT,
  target: {
    applicationId: "application-2",
    listingId: "listing-2",
    workflowId: null,
    proposalId: null,
    appointmentId: null,
    section: "APPLICATION",
    activityId: "notification-2-activity",
    action: "OPEN_HISTORY",
  },
});
const older = notification({
  id: "notification-3",
  type: "VIEWING_ACCEPTED",
  occurredAt: OLDER,
  createdAt: OLDER,
  readAt: OLDER,
});

async function openBell() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Benachrichtigungen/ }));
  return user;
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotificationUnreadCount.mockResolvedValue({
      asOf: AT,
      unreadCount: 4,
      nextRevalidateAt: null,
    });
    listNotifications.mockResolvedValue(page([viewing, application]));
    markNotificationRead.mockResolvedValue({
      id: viewing.id,
      readAt: AT,
    });
    markAllNotificationsRead.mockResolvedValue({ markedCount: 1 });
  });

  it("shows the global unread count and ignores the list count", async () => {
    render(<NotificationBell role="applicant" />);

    const trigger = await screen.findByRole("button", {
      name: "Benachrichtigungen: 4 ungelesene Benachrichtigungen",
    });
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    const icon = trigger.querySelector(".lucide-bell");
    expect(icon).toBeInstanceOf(SVGElement);
    expect(icon?.getAttribute("stroke-width")).toBe("2");
    expect(icon?.getAttribute("width")).toBe("16");
    expect(icon?.classList.contains("shrink-0")).toBe(true);
    expect(trigger.querySelector(".lucide-triangle-alert")).toBeNull();
    expect(trigger.querySelector(".lucide-message-square")).toBeNull();
    expect(screen.getByText("4")).toBeTruthy();

    await openBell();
    expect(await screen.findByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.queryByText("99")).toBeNull();
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(1);
  });

  it("does not mark notifications read when the list opens", async () => {
    render(<NotificationBell role="applicant" />);
    await openBell();
    expect(await screen.findByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(markNotificationRead).not.toHaveBeenCalled();
    expect(markAllNotificationsRead).not.toHaveBeenCalled();
  });

  it("renders Alle with German labels, time, and unread treatment", async () => {
    render(<NotificationBell role="applicant" />);
    await openBell();

    const unread = await screen.findByRole("link", {
      name: /Neuer Terminvorschlag/,
    });
    const read = screen.getByRole("link", { name: /Bewerbung abgelehnt/ });
    expect(unread.querySelector(".bg-primary")).toBeInstanceOf(HTMLElement);
    expect(read.querySelector(".bg-primary")).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Als gelesen markieren" }),
    ).toHaveLength(1);
    expect(screen.getAllByText(formatDateTime(AT)).length).toBeGreaterThan(0);
    expect(screen.queryByText("VIEWING_PROPOSED")).toBeNull();
    expect(screen.queryByText("VIEWING")).toBeNull();
    expect(screen.queryByText("APPLICATION")).toBeNull();
    expect(screen.queryByText("listing-1")).toBeNull();
    expect(screen.queryByText("application-1")).toBeNull();
    expect(screen.queryByText(/Wartende Person/)).toBeNull();
  });

  it("filters unread items on the client without a new request or badge change", async () => {
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Bewerbung abgelehnt");
    const calls = listNotifications.mock.calls.length;

    await user.click(screen.getByRole("button", { name: "Ungelesen" }));

    expect(screen.queryByText("Bewerbung abgelehnt")).toBeNull();
    expect(screen.getByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(listNotifications).toHaveBeenCalledTimes(calls);
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("keeps older pages available when the loaded page has no unread items", async () => {
    listNotifications.mockResolvedValue(
      page([application], { beforeCreatedAt: AT, beforeId: application.id }),
    );
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Bewerbung abgelehnt");

    await user.click(screen.getByRole("button", { name: "Ungelesen" }));

    expect(screen.getByText(notificationCopy.emptyUnread)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Weitere laden" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("loads the viewing category without changing the badge", async () => {
    listNotifications.mockImplementation(
      async (query: { category?: string }) =>
        query.category === "VIEWING"
          ? page([viewing])
          : page([viewing, application]),
    );
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Bewerbung abgelehnt");

    await user.click(screen.getByRole("button", { name: "Besichtigungen" }));

    expect(await screen.findByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(screen.queryByText("Bewerbung abgelehnt")).toBeNull();
    expect(listNotifications).toHaveBeenLastCalledWith({
      limit: 25,
      category: "VIEWING",
    });
    expect(screen.getByText("4")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Alle" }));
    await screen.findByText("Bewerbung abgelehnt");
    expect(listNotifications).toHaveBeenLastCalledWith({ limit: 25 });
  });

  it("loads the application category", async () => {
    listNotifications.mockImplementation(
      async (query: { category?: string }) =>
        query.category === "APPLICATION"
          ? page([application])
          : page([viewing]),
    );
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Neuer Terminvorschlag");

    await user.click(screen.getByRole("button", { name: "Bewerbungen" }));

    expect(await screen.findByText("Bewerbung abgelehnt")).toBeTruthy();
    expect(listNotifications).toHaveBeenLastCalledWith({
      limit: 25,
      category: "APPLICATION",
    });
  });

  it("shows an empty documents category", async () => {
    listNotifications.mockImplementation(
      async (query: { category?: string }) =>
        query.category === "DOCUMENTS" ? page([]) : page([viewing]),
    );
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Neuer Terminvorschlag");

    await user.click(screen.getByRole("button", { name: "Unterlagen" }));

    expect(
      await screen.findByText(notificationCopy.emptyCategory),
    ).toBeTruthy();
    expect(screen.queryByText("Neuer Terminvorschlag")).toBeNull();
  });

  it("shows an empty inbox", async () => {
    listNotifications.mockResolvedValue(page([]));
    render(<NotificationBell role="applicant" />);
    await openBell();
    expect(await screen.findByText(notificationCopy.emptyAll)).toBeTruthy();
  });

  it("shows no unread notifications when the loaded page is already read", async () => {
    listNotifications.mockResolvedValue(page([application]));
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByText("Bewerbung abgelehnt");

    await user.click(screen.getByRole("button", { name: "Ungelesen" }));

    expect(screen.getByText(notificationCopy.emptyUnread)).toBeTruthy();
    expect(screen.queryByText("Bewerbung abgelehnt")).toBeNull();
  });

  it("marks one notification read from the backend and refetches", async () => {
    listNotifications
      .mockResolvedValueOnce(page([viewing]))
      .mockResolvedValueOnce(page([{ ...viewing, readAt: AT }]));
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByRole("button", { name: "Als gelesen markieren" });

    await user.click(
      screen.getByRole("button", { name: "Als gelesen markieren" }),
    );

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith(viewing.id);
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Als gelesen markieren" }),
      ).toBeNull();
    });
    expect(getNotificationUnreadCount.mock.calls.length).toBeGreaterThan(1);
  });

  it("marks every notification through the list snapshot", async () => {
    listNotifications
      .mockResolvedValueOnce(page([viewing]))
      .mockResolvedValueOnce(page([]));
    getNotificationUnreadCount
      .mockResolvedValueOnce({
        asOf: AT,
        unreadCount: 4,
        nextRevalidateAt: null,
      })
      .mockResolvedValue({
        asOf: AT,
        unreadCount: 0,
        nextRevalidateAt: null,
      });
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByRole("button", { name: "Alle als gelesen" });

    await user.click(screen.getByRole("button", { name: "Alle als gelesen" }));

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalledWith(AT);
    });
    expect(markAllNotificationsRead).not.toHaveBeenCalledWith(
      expect.stringMatching(/2027/),
    );
  });

  it("loads the next page with the full cursor", async () => {
    listNotifications
      .mockResolvedValueOnce(
        page([viewing], { beforeCreatedAt: AT, beforeId: viewing.id }),
      )
      .mockResolvedValueOnce(page([older]));
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByRole("button", { name: "Weitere laden" });

    await user.click(screen.getByRole("button", { name: "Weitere laden" }));

    expect(await screen.findByText("Termin bestätigt")).toBeTruthy();
    expect(listNotifications).toHaveBeenLastCalledWith({
      limit: 25,
      beforeCreatedAt: AT,
      beforeId: viewing.id,
    });
    for (const [query] of listNotifications.mock.calls) {
      const cursor = query as {
        beforeCreatedAt?: string;
        beforeId?: string;
      };
      expect(
        (cursor.beforeCreatedAt !== undefined) ===
          (cursor.beforeId !== undefined),
      ).toBe(true);
    }
  });

  it("groups loaded notifications by listing without a title request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<NotificationBell role="applicant" />);
    await openBell();

    expect(await screen.findByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(screen.getAllByText("Inserat")).toHaveLength(2);
    expect(listNotifications).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("uses a cached listing label when one is supplied", async () => {
    render(
      <NotificationInbox
        role="applicant"
        unreadCount={4}
        onRead={() => undefined}
        listingLabels={new Map([["listing-1", "Haus in Bawinkel"]])}
      />,
    );

    expect(await screen.findByText("Haus in Bawinkel")).toBeTruthy();
    expect(screen.getByText("Inserat")).toBeTruthy();
    expect(listNotifications).toHaveBeenCalledTimes(1);
  });

  it("falls back when the notification type is unknown", async () => {
    listNotifications.mockResolvedValue(
      page([notification({ id: "notification-9", type: "NOT_A_REAL_TYPE" })]),
    );
    render(<NotificationBell role="applicant" />);
    await openBell();

    expect(await screen.findByText("Neue Benachrichtigung")).toBeTruthy();
    expect(screen.queryByText("NOT_A_REAL_TYPE")).toBeNull();
  });

  it("refetches after a failed mark instead of showing a local read state", async () => {
    markNotificationRead.mockRejectedValue(new Error("read failed"));
    listNotifications.mockResolvedValue(page([viewing]));
    render(<NotificationBell role="applicant" />);
    const user = await openBell();
    await screen.findByRole("button", { name: "Als gelesen markieren" });
    const calls = listNotifications.mock.calls.length;

    await user.click(
      screen.getByRole("button", { name: "Als gelesen markieren" }),
    );

    expect(await screen.findByText(notificationCopy.actionError)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Als gelesen markieren" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByText("4")).toBeTruthy();
    expect(listNotifications.mock.calls.length).toBeGreaterThan(calls);
  });

  it("keeps the badge when the list request fails", async () => {
    listNotifications.mockRejectedValueOnce(new Error("list failed"));
    render(<NotificationBell role="applicant" />);
    const user = await openBell();

    expect(await screen.findByText(notificationCopy.listError)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Erneut versuchen" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByText("4")).toBeTruthy();

    listNotifications.mockResolvedValueOnce(page([viewing]));
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(await screen.findByText("Neuer Terminvorschlag")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("renders only notifications the backend returned", async () => {
    render(<NotificationBell role="applicant" />);
    await openBell();
    await screen.findByText("Neuer Terminvorschlag");

    expect(screen.queryByText("Bewerbung angenommen")).toBeNull();
    expect(screen.queryByText("Wartende Person")).toBeNull();
    expect(screen.queryByText("application-hidden")).toBeNull();
  });

  it("opens the applicant application from the stored target", async () => {
    render(<NotificationBell role="applicant" />);
    await openBell();
    const link = await screen.findByRole("link", {
      name: /Neuer Terminvorschlag/,
    });
    expect(link.getAttribute("href")).toBe(
      "/applicant/applications/application-1?section=viewing&activityId=notification-1-activity",
    );
    expect(selectDashboardListing).not.toHaveBeenCalled();
  });

  it("opens the provider listing from the stored target", async () => {
    render(<NotificationBell role="provider" />);
    const user = await openBell();
    const link = await screen.findByRole("link", {
      name: /Neuer Terminvorschlag/,
    });
    expect(link.getAttribute("href")).toBe(
      "/provider/applications/application-1?listingId=listing-1&section=viewing&activityId=notification-1-activity",
    );

    await user.click(link);
    expect(selectDashboardListing).toHaveBeenCalledWith("listing-1");
  });

  it("refetches the bell count and the open inbox from a notification hint", async () => {
    render(<NotificationBell role="applicant" />);
    await openBell();
    await screen.findByRole("link", { name: /Neuer Terminvorschlag/ });
    const countsBefore = getNotificationUnreadCount.mock.calls.length;
    const listsBefore = listNotifications.mock.calls.length;

    scheduleNotificationsChanged("applicant");
    await waitFor(() => {
      expect(getNotificationUnreadCount.mock.calls.length).toBeGreaterThan(
        countsBefore,
      );
    });
    await waitFor(() => {
      expect(listNotifications.mock.calls.length).toBeGreaterThan(listsBefore);
    });
    resetRealtimeSchedules();
  });

  it("does not refetch the bell for a chat event", async () => {
    render(<NotificationBell role="applicant" />);
    await waitFor(() =>
      expect(getNotificationUnreadCount).toHaveBeenCalledTimes(1),
    );
    scheduleConversationMessage("applicant", "application-1");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(getNotificationUnreadCount).toHaveBeenCalledTimes(1);
    expect(listNotifications).not.toHaveBeenCalled();
    resetRealtimeSchedules();
  });
});
