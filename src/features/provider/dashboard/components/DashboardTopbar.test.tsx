import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/lib/api/auth";
import { DashboardTopbar } from "./DashboardTopbar";

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
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

describe("DashboardTopbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "provider-1",
      name: "Mara Lehmann",
      email: "mara@example.com",
      role: "provider",
      providerType: "company",
      companyName: "Lehmann Wohnen",
    });
  });

  it("mounts the shared account menu", async () => {
    render(<DashboardTopbar />);

    expect(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    ).not.toBeNull();
  });

  it("keeps a single account control", async () => {
    render(<DashboardTopbar />);

    await screen.findByText("Mara Lehmann");

    expect(
      screen.getAllByRole("button", { name: "Konto & Profil" }),
    ).toHaveLength(1);
  });

  it("does not render the accent selector", async () => {
    render(<DashboardTopbar />);

    await screen.findByText("Mara Lehmann");

    expect(screen.queryByText("Dashboard-Akzent")).toBeNull();
  });
});
