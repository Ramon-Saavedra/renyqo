import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, logout } from "@/lib/api/auth";
import { AccountMenu } from "./AccountMenu";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

const COMPANY_USER = {
  id: "provider-1",
  name: "Mara Lehmann",
  email: "mara@example.com",
  role: "provider",
  providerType: "company",
  companyName: "Lehmann Wohnen",
} as const;

const PRIVATE_USER = {
  id: "provider-2",
  name: "Nora Keller",
  email: "nora@example.com",
  role: "provider",
  providerType: "private",
  companyName: null,
} as const;

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the authenticated name and company in the full variant", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu variant="full" />);

    expect(await screen.findByText("Mara Lehmann")).not.toBeNull();
    expect(screen.getByText("Lehmann Wohnen")).not.toBeNull();
  });

  it("does not render a company line for private providers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);

    render(<AccountMenu variant="full" />);

    expect(await screen.findByText("Nora Keller")).not.toBeNull();
    expect(screen.queryByText("Lehmann Wohnen")).toBeNull();
  });

  it("uses the profile control as the menu trigger", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu variant="full" />);

    const trigger = await screen.findByRole("button", {
      name: "Konto & Profil",
    });

    await vi.waitFor(() => {
      expect(trigger.textContent).toContain("ML");
    });
    expect(trigger.textContent).toContain("Mara Lehmann");
  });

  it("shows appearance, logout and the email in the panel", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Konto & Profil" }),
    ).not.toBeNull();
    expect(screen.getByText("Darstellung")).not.toBeNull();
    const logoutButton = screen.getByRole("button", { name: "Abmelden" });
    expect(logoutButton.className).toContain("text-danger");
    expect(logoutButton.className).toContain("h-8");
    expect(screen.getByText("mara@example.com")).not.toBeNull();
  });

  it("does not offer an accent selector", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );

    expect(screen.queryByText("Akzentfarbe anpassen")).toBeNull();
    expect(
      screen.queryByRole("radiogroup", { name: "Akzentfarbe wählen" }),
    ).toBeNull();
  });

  it("never shows a hardcoded name when the session request fails", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("unauthorized"));

    render(<AccountMenu variant="full" />);

    const trigger = await screen.findByRole("button", {
      name: "Konto & Profil",
    });

    expect(trigger.textContent).not.toContain("Sabine");
    expect(trigger.textContent).not.toContain("undefined");
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);
    vi.mocked(logout).mockResolvedValue(undefined);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows an error and stays open when logout fails", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);
    vi.mocked(logout).mockRejectedValue(new Error("network error"));

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    expect(
      screen.getByText("Abmeldung fehlgeschlagen. Bitte versuche es erneut."),
    ).not.toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Konto & Profil" }),
    ).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("prevents a second logout while the first request is pending", async () => {
    const user = userEvent.setup();
    let resolveLogout: () => void = () => undefined;
    const pendingLogout = new Promise<void>((resolve) => {
      resolveLogout = resolve;
    });
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);
    vi.mocked(logout).mockReturnValue(pendingLogout);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );
    const logoutButton = screen.getByRole("button", { name: "Abmelden" });
    await user.click(logoutButton);
    await user.click(logoutButton);

    expect(logout).toHaveBeenCalledTimes(1);

    resolveLogout();
    await pendingLogout;
  });
});
