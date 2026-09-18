import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { currentUserSessionCopy } from "@/components/auth/current-user-session-copy";
import { LISTINGS_SEARCH_SESSION_KEY } from "@/features/applicant/listings/utils/listings-search-params";
import { useApplicantProfileStatus } from "@/features/applicant/profile/hooks/useApplicantProfileStatus";
import { getCurrentUser, logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { AccountMenu } from "./AccountMenu";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/listings",
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/features/applicant/profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(() => "exists"),
  invalidateApplicantProfile: vi.fn(),
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

const APPLICANT_USER = {
  id: "applicant-1",
  name: "Jonas Weber",
  email: "jonas@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
} as const;

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCurrentUser();
    sessionStorage.clear();
    vi.mocked(useApplicantProfileStatus).mockReturnValue("exists");
  });

  it("highlights the second name and renders company in the full variant", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu variant="full" />);

    const secondName = await screen.findByText("Lehmann");
    expect(secondName.className).toContain("text-primary");
    expect(secondName.className).toContain("font-semibold");
    expect(screen.getByText("Lehmann Wohnen")).not.toBeNull();
  });

  it("does not render a company line for private providers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);

    render(<AccountMenu variant="full" />);

    expect(await screen.findByText("Keller")).not.toBeNull();
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

  it("does not treat a recoverable session error as a logged-in or anonymous menu", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError(500, "fail", "http"),
    );

    render(<AccountMenu variant="full" />);

    expect(
      await screen.findByRole("button", {
        name: currentUserSessionCopy.retry,
      }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.queryByRole("button", { name: "Konto & Profil" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Registrieren" })).toBeNull();
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(PRIVATE_USER);
    vi.mocked(logout).mockResolvedValue(undefined);
    sessionStorage.setItem(LISTINGS_SEARCH_SESSION_KEY, "query=Freiburg");

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );
    await user.click(screen.getByRole("button", { name: "Abmelden" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBeNull();
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

  it("shows Gemerkt below the profile link for applicants", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(APPLICANT_USER);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );

    const profileLink = screen.getByRole("link", {
      name: "Bewerbungsprofil bearbeiten",
    });
    const savedLink = screen.getByRole("link", { name: "Gemerkt" });

    expect(savedLink.getAttribute("href")).toBe("/applicant/saved");
    expect(
      profileLink.compareDocumentPosition(savedLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not show Gemerkt for providers", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(COMPANY_USER);

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );

    expect(screen.queryByRole("link", { name: "Gemerkt" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Bewerbungsprofil bearbeiten" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Bewerbungsprofil erstellen" }),
    ).toBeNull();
  });

  it("keeps the profile destination when profile status is unavailable", async () => {
    const user = userEvent.setup();
    vi.mocked(getCurrentUser).mockResolvedValue(APPLICANT_USER);
    vi.mocked(useApplicantProfileStatus).mockReturnValue("unavailable");

    render(<AccountMenu />);

    await user.click(
      await screen.findByRole("button", { name: "Konto & Profil" }),
    );

    const profileLink = screen.getByRole("link", {
      name: "Bewerbungsprofil",
    });
    const savedLink = screen.getByRole("link", { name: "Gemerkt" });

    expect(profileLink.getAttribute("href")).toContain("/applicant/profile");
    expect(
      profileLink.compareDocumentPosition(savedLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each([
    {
      destination: "/applicant/profile",
      linkName: "Bewerbungsprofil bearbeiten",
      activation: "mouse",
    },
    {
      destination: "/applicant/saved",
      linkName: "Gemerkt",
      activation: "mouse",
    },
    {
      destination: "/applicant/profile",
      linkName: "Bewerbungsprofil bearbeiten",
      activation: "keyboard",
    },
    {
      destination: "/applicant/saved",
      linkName: "Gemerkt",
      activation: "keyboard",
    },
  ] as const)(
    "closes the account popover after $activation navigation to $destination",
    async ({ destination, linkName, activation }) => {
      const user = userEvent.setup();
      vi.mocked(getCurrentUser).mockResolvedValue(APPLICANT_USER);

      render(<AccountMenu />);

      const trigger = await screen.findByRole("button", {
        name: "Konto & Profil",
      });
      await user.click(trigger);
      const dialog = screen.getByRole("dialog", { name: "Konto & Profil" });
      const link = screen.getByRole("link", { name: linkName });

      expect(
        new URL(link.getAttribute("href") ?? "", "http://localhost").pathname,
      ).toBe(destination);
      link.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
      if (activation === "keyboard") {
        await waitFor(() => expect(document.activeElement).toBe(dialog));
        link.focus();
        await user.keyboard("{Enter}");
      } else {
        await user.click(link);
      }

      expect(
        screen.queryByRole("dialog", { name: "Konto & Profil" }),
      ).toBeNull();
      expect(dialog.contains(document.activeElement)).toBe(false);
      expect(document.activeElement).toBe(trigger);
    },
  );
});
