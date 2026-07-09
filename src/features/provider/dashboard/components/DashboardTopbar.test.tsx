import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, logout } from "@/lib/api/auth";
import { DashboardTopbar } from "./DashboardTopbar";

const replace = vi.fn();
const onAccentChange = vi.fn();

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

describe("DashboardTopbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the authenticated provider name and company from the backend", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-1",
      name: "Ramon Saavedra",
      email: "ramon@example.com",
      role: "provider",
      providerType: "company",
      companyName: "Renyqo Immobilien",
    });

    render(
      <DashboardTopbar accent="schiefer" onAccentChange={onAccentChange} />,
    );

    expect(await screen.findByText("Ramon Saavedra")).not.toBeNull();
    expect(screen.getByText("Renyqo Immobilien")).not.toBeNull();
    expect(screen.queryByText("Kessler Immobilien GbR")).toBeNull();
  });

  it("does not render a company line for private providers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-2",
      name: "Sabine Privat",
      email: "sabine@example.com",
      role: "provider",
      providerType: "private",
      companyName: null,
    });

    render(
      <DashboardTopbar accent="schiefer" onAccentChange={onAccentChange} />,
    );

    expect(await screen.findByText("Sabine Privat")).not.toBeNull();
    expect(screen.queryByText("Kessler Immobilien GbR")).toBeNull();
  });

  it("shows the user email in the settings menu", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-3",
      name: "Mara Lehmann",
      email: "mara@example.com",
      role: "provider",
      providerType: "company",
      companyName: "Lehmann Wohnen",
    });

    render(
      <DashboardTopbar accent="schiefer" onAccentChange={onAccentChange} />,
    );

    await screen.findByText("Mara Lehmann");
    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));

    expect(
      screen.getByRole("dialog", { name: "Konto & Profil" }),
    ).not.toBeNull();
    expect(screen.getByText("mara@example.com")).not.toBeNull();
  });

  it("falls back to the local profile name when the current user request fails", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("unauthorized"));

    render(
      <DashboardTopbar accent="schiefer" onAccentChange={onAccentChange} />,
    );

    expect(await screen.findByText("Sabine Kessler")).not.toBeNull();
    expect(screen.queryByText("Kessler Immobilien GbR")).toBeNull();
  });

  it("logs out and redirects to login from the settings menu", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-4",
      name: "Nora Keller",
      email: "nora@example.com",
      role: "provider",
      providerType: "private",
      companyName: null,
    });
    vi.mocked(logout).mockResolvedValue(undefined);

    render(
      <DashboardTopbar accent="schiefer" onAccentChange={onAccentChange} />,
    );

    await screen.findByText("Nora Keller");
    await user.click(screen.getByRole("button", { name: "Konto & Profil" }));
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
