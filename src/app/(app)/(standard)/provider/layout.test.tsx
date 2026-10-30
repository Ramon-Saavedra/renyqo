import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProviderLayout from "./layout";

vi.mock("@/components/shared/attention/TopbarAttentionControl", () => ({
  TopbarAttentionControl: () => null,
}));

vi.mock("@/components/shared/attention/TopbarMessagesControl", () => ({
  TopbarMessagesControl: () => null,
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
  AccountMenu: () => <div>Account menu</div>,
}));

vi.mock("@/components/layout/app-topbar/AppTopbar", () => ({
  AppTopbar: ({
    children,
    className,
    logoHref,
  }: {
    children: React.ReactNode;
    className: string;
    logoHref: string;
  }) => (
    <header className={className}>
      <a href={logoHref}>Renyqo</a>
      {children}
    </header>
  ),
}));

describe("ProviderLayout", () => {
  it("renders common sticky chrome and preserves page content", () => {
    render(
      <ProviderLayout>
        <main>Provider page content</main>
      </ProviderLayout>,
    );

    expect(
      screen.getByRole("link", { name: "Renyqo" }).getAttribute("href"),
    ).toBe("/provider/dashboard");
    expect(screen.getByText("Account menu")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Provider page content")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("banner").className).toContain("sticky top-0 z-30");
    expect(screen.getByRole("banner").className).toContain("h-app-topbar");
  });
});
