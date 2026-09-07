import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicantProfileStatus } from "../hooks/useApplicantProfileStatus";
import { ProfileMenuLink } from "./ProfileMenuLink";

vi.mock("next/navigation", () => ({
  usePathname: () => "/listings",
}));

vi.mock("../hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(),
}));

const mockStatus = vi.mocked(useApplicantProfileStatus);

describe("ProfileMenuLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the edit label when a profile exists", () => {
    mockStatus.mockReturnValue("exists");
    render(<ProfileMenuLink />);

    expect(
      screen.getByRole("link", { name: "Bewerbungsprofil bearbeiten" }),
    ).toBeInstanceOf(HTMLAnchorElement);
  });

  it("uses the create label when a profile is missing", () => {
    mockStatus.mockReturnValue("missing");
    render(<ProfileMenuLink />);

    expect(
      screen.getByRole("link", { name: "Bewerbungsprofil erstellen" }),
    ).toBeInstanceOf(HTMLAnchorElement);
  });

  it("uses a neutral profile label when status is unavailable", () => {
    mockStatus.mockReturnValue("unavailable");
    render(<ProfileMenuLink />);

    const link = screen.getByRole("link", { name: "Bewerbungsprofil" });
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link.getAttribute("href")).toContain("/applicant/profile");
    expect(
      screen.queryByRole("link", { name: "Bewerbungsprofil erstellen" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Bewerbungsprofil bearbeiten" }),
    ).toBeNull();
  });
});
