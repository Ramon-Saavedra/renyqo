import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentUserSessionCopy } from "@/components/auth/current-user-session-copy";
import { useCurrentUser } from "@/lib/api/use-current-user";
import type * as currentUserApi from "@/lib/api/use-current-user";
import { ListingsTopbarActions } from "./ListingsTopbarActions";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/listings",
}));

vi.mock("@/lib/api/use-current-user", async (importOriginal) => {
  const actual = await importOriginal<typeof currentUserApi>();
  return {
    ...actual,
    useCurrentUser: vi.fn(),
  };
});

vi.mock("@/components/layout/account-menu/AccountMenu", () => ({
  AccountMenu: () => <div>account menu</div>,
}));

const currentUser = vi.mocked(useCurrentUser);

describe("ListingsTopbarActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows login and register only for a confirmed anonymous session", () => {
    currentUser.mockReturnValue({ user: null, loading: false, error: false });

    render(<ListingsTopbarActions />);

    expect(
      screen.getByRole("link", { name: "Anmelden" }).getAttribute("href"),
    ).toBe("/login");
    expect(
      screen.getByRole("link", { name: "Registrieren" }).getAttribute("href"),
    ).toBe("/register/account-type");
    expect(
      screen.queryByRole("button", { name: currentUserSessionCopy.retry }),
    ).toBeNull();
  });

  it("does not show login or register while the session lookup is in error", () => {
    currentUser.mockReturnValue({ user: null, loading: false, error: true });

    render(<ListingsTopbarActions />);

    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Registrieren" })).toBeNull();
    expect(screen.queryByText("account menu")).toBeNull();
    expect(
      screen.queryByRole("button", { name: currentUserSessionCopy.retry }),
    ).toBeNull();
  });

  it("does not show login or register while the session is loading", () => {
    currentUser.mockReturnValue({ user: null, loading: true, error: false });

    render(<ListingsTopbarActions />);

    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Registrieren" })).toBeNull();
  });
});
