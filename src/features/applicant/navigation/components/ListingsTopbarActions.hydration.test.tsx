import { act, cleanup, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SafeUser } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  setCurrentUser,
} from "@/lib/api/use-current-user";
import { ListingsTopbarActions } from "./ListingsTopbarActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/listings",
}));

vi.mock("@/features/notifications/api/notifications", () => ({
  getNotificationUnreadCount: vi.fn().mockResolvedValue({
    asOf: "2026-10-26T08:00:00.000Z",
    unreadCount: 0,
    nextRevalidateAt: null,
  }),
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("@/components/layout/account-menu/AccountMenu", () => ({
  AccountMenu: () => <div data-testid="account-menu">account menu</div>,
}));

const applicant: SafeUser = {
  id: "applicant-1",
  name: "Ada Applicant",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

describe("ListingsTopbarActions hydration", () => {
  let hydrationRoot: Root | null = null;
  let hydrationContainer: HTMLDivElement | null = null;

  afterEach(async () => {
    if (hydrationRoot !== null) {
      await act(async () => {
        hydrationRoot!.unmount();
      });
      hydrationRoot = null;
    }
    hydrationContainer?.remove();
    hydrationContainer = null;
    cleanup();
    invalidateCurrentUser();
  });

  it("hydrates the loading shell when the client session cache already has a user", async () => {
    setCurrentUser(applicant);
    const html = renderToString(<ListingsTopbarActions />);
    expect(html).toContain("sk-circle");
    expect(html).not.toContain("sk-pill");

    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = html;
    hydrationContainer = container;

    const recoverableErrors: unknown[] = [];
    await act(async () => {
      hydrationRoot = hydrateRoot(container, <ListingsTopbarActions />, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(
      hydrationContainer.querySelector('[data-testid="account-menu"]'),
    ).not.toBeNull();
  });

  it("shows the account menu only after hydration resolves the session", async () => {
    setCurrentUser(applicant);
    render(<ListingsTopbarActions />);
    expect(screen.getByTestId("account-menu")).not.toBeNull();
  });
});
