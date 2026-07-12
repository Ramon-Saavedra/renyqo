import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "@/lib/api/auth";
import { DashboardSettingsMenu } from "./DashboardSettingsMenu";

const replace = vi.fn();
const onAccentChange = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  logout: vi.fn(),
}));

function renderMenu(userEmail: string | null = "provider@example.com") {
  render(
    <DashboardSettingsMenu
      accent="schiefer"
      onAccentChange={onAccentChange}
      userEmail={userEmail}
      trigger={<span>Sabine Kessler</span>}
      triggerClassName="settings-button"
    />,
  );
}

describe("DashboardSettingsMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the settings dialog with profile tools", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));

    expect(
      screen.getByRole("dialog", { name: "Konto & Profil" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("radiogroup", { name: "Akzentfarbe wählen" }),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Abmelden" })).not.toBeNull();
    expect(screen.getByText("provider@example.com")).not.toBeNull();
  });

  it("closes the settings dialog with Escape", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Konto & Profil" })).toBeNull();
  });

  it("calls onAccentChange when an accent is selected", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));
    await user.click(screen.getByRole("radio", { name: "Salbei" }));

    expect(onAccentChange).toHaveBeenCalledWith("salbei");
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();
    vi.mocked(logout).mockResolvedValue(undefined);
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("keeps the menu usable when logout fails", async () => {
    const user = userEvent.setup();
    vi.mocked(logout).mockRejectedValue(new Error("server"));
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Abmelden" })).not.toBeNull();
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
