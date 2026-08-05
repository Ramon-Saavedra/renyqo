import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { ProfileNotice } from "./ProfileNotice";

vi.mock("../../profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(),
}));

const mockProfileStatus = vi.mocked(useApplicantProfileStatus);

describe("ProfileNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when profile exists", () => {
    mockProfileStatus.mockReturnValue("exists");
    const { container } = render(<ProfileNotice returnTo="/listings" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders null when profile status is unavailable", () => {
    mockProfileStatus.mockReturnValue("unavailable");
    const { container } = render(<ProfileNotice returnTo="/listings" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders null while loading", () => {
    mockProfileStatus.mockReturnValue("loading");
    const { container } = render(<ProfileNotice returnTo="/listings" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the CTA notice when profile is missing", () => {
    mockProfileStatus.mockReturnValue("missing");
    render(<ProfileNotice returnTo="/listings" />);

    expect(screen.getByText(/Erstelle dein/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Bewerbungsprofil")).toBeInstanceOf(HTMLElement);
  });

  it("links to the profile page with returnTo param", () => {
    mockProfileStatus.mockReturnValue("missing");
    render(<ProfileNotice returnTo="/listings" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("/applicant/profile");
    expect(link.getAttribute("href")).toContain("returnTo=%2Flistings");
  });
});
