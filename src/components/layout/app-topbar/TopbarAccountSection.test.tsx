import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attentionCopy } from "@/lib/attention/copy";
import { emptyApplicationAttentionSummary } from "@/lib/attention/fixtures";
import {
  groupGlobalAttentionItems,
  groupGlobalMessageItems,
} from "@/lib/attention/global-attention";
import type { ApplicationAttentionListItem } from "@/lib/attention/types";
import { notificationCopy } from "@/features/notifications/copy";
import { TopbarAccountSection } from "./TopbarAccountSection";

const useGlobalAttention = vi.hoisted(() => vi.fn());

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  useGlobalAttention,
}));

vi.mock("@/features/notifications/api/notifications", () => ({
  getNotificationUnreadCount: vi.fn().mockResolvedValue({
    asOf: "2026-10-26T08:00:00.000Z",
    unreadCount: 6,
    nextRevalidateAt: null,
  }),
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("@/components/layout/account-menu/AccountMenu", () => ({
  AccountMenu: () => <div>Konto</div>,
}));

function item(
  applicationId: string,
  listingTitle: string,
  overrides: Partial<ApplicationAttentionListItem> = {},
): ApplicationAttentionListItem {
  return {
    ...emptyApplicationAttentionSummary(),
    applicationId,
    listingId: `${applicationId}-listing`,
    listingTitle,
    listingCity: "Bawinkel",
    ...overrides,
  };
}

const messageOnly = item("messages-only", "Nur Nachricht", {
  actionableUnreadMessageCount: 1,
});
const actionOnly = item("action-only", "Nur Aktion", {
  pendingActionCount: 1,
  hasPendingAction: true,
  categories: {
    documentUploadCount: 0,
    documentReviewCount: 0,
    viewingActionCount: 1,
  },
});
const mixed = item("mixed", "Beides", {
  pendingActionCount: 1,
  hasPendingAction: true,
  actionableUnreadMessageCount: 1,
});

describe("TopbarAccountSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      attentionCount: 2,
      messageCount: 4,
      attentionGroups: groupGlobalAttentionItems(
        [messageOnly, actionOnly, mixed],
        "applicant",
      ),
      messageGroups: groupGlobalMessageItems(
        [messageOnly, actionOnly, mixed],
        "applicant",
      ),
      hasMore: false,
      loadMore: vi.fn(),
      loadingMore: false,
      loadMoreError: false,
    });
  });

  it("separates message, notification, and attention controls", async () => {
    render(<TopbarAccountSection role="applicant" />);

    const messages = screen.getByRole("button", {
      name: `${attentionCopy.messagesMenuTitle}: ${attentionCopy.unreadMessages(4)}`,
    });
    const notifications = await screen.findByRole("button", {
      name: `${notificationCopy.title}: ${notificationCopy.badge(6)}`,
    });
    const attention = screen.getByRole("button", {
      name: `${attentionCopy.globalMenuTitle}: ${attentionCopy.globalMenuAriaLabel(2)}`,
    });

    const messageIcon = messages.querySelector(".lucide-message-square");
    expect(messageIcon).toBeInstanceOf(SVGElement);
    expect(messageIcon?.classList.contains("shrink-0")).toBe(true);
    expect(messageIcon?.getAttribute("stroke-width")).toBe("2");
    expect(messageIcon?.getAttribute("width")).toBe("16");
    expect(notifications.querySelector(".lucide-bell")).toBeInstanceOf(
      SVGElement,
    );
    expect(attention.querySelector(".lucide-triangle-alert")).toBeInstanceOf(
      SVGElement,
    );
    expect(messages.querySelector(".lucide-bell")).toBeNull();
    expect(attention.querySelector(".lucide-message-square")).toBeNull();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();

    const user = userEvent.setup();
    await user.click(attention);
    const attentionMenu = screen.getByRole("dialog", {
      name: attentionCopy.globalMenuTitle,
    });
    expect(attentionMenu.textContent).toContain("Nur Aktion");
    expect(attentionMenu.textContent).toContain("Beides");
    expect(attentionMenu.textContent).toContain(attentionCopy.viewingAction(1));
    expect(attentionMenu.textContent).toContain(
      attentionCopy.pendingActions(1),
    );
    expect(attentionMenu.textContent).not.toContain("Nur Nachricht");
    expect(attentionMenu.textContent).not.toContain("ungelesene Nachricht");

    await user.click(messages);
    const messageMenu = screen.getByRole("dialog", {
      name: attentionCopy.messagesMenuTitle,
    });
    expect(messageMenu.textContent).toContain("Nur Nachricht");
    expect(messageMenu.textContent).toContain("Beides");
    expect(messageMenu.textContent).not.toContain("Nur Aktion");
    expect(
      messageMenu.querySelector(
        'a[href="/applicant/applications/messages-only?section=messages"]',
      ),
    ).toBeInstanceOf(HTMLAnchorElement);
    expect(
      messageMenu.querySelector(
        'a[href="/applicant/applications/mixed?section=messages"]',
      ),
    ).toBeInstanceOf(HTMLAnchorElement);
  });
});
