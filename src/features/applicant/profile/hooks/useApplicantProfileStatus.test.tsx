import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/api/auth";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { INITIAL_PROFILE } from "../utils/profile-validation";
import { getApplicantProfile } from "../api/applicant-profile";
import {
  invalidateApplicantProfile,
  setApplicantProfileCache,
  useApplicantProfileStatus,
} from "./useApplicantProfileStatus";

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../api/applicant-profile", () => ({
  getApplicantProfile: vi.fn(),
}));

const applicant = {
  id: "applicant-1",
  name: "Anna Beispiel",
  email: "anna@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
} as const;

const provider = {
  id: "provider-1",
  name: "Peter Beispiel",
  email: "peter@example.com",
  role: "provider",
  providerType: "private",
  companyName: null,
} as const;

const profile = INITIAL_PROFILE;

function StatusHarness() {
  const status = useApplicantProfileStatus();

  return <span data-testid="profile-status">{status}</span>;
}

describe("useApplicantProfileStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCurrentUser();
    invalidateApplicantProfile();
    vi.mocked(getCurrentUser).mockResolvedValue(applicant);
    vi.mocked(getApplicantProfile).mockResolvedValue(null);
  });

  it("reports a missing profile for applicants without one", async () => {
    render(<StatusHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("profile-status").textContent).toBe("missing"),
    );
  });

  it("reports an existing profile for applicants with one", async () => {
    vi.mocked(getApplicantProfile).mockResolvedValue(profile);

    render(<StatusHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("profile-status").textContent).toBe("exists"),
    );
  });

  it("does not query the profile for providers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(provider);

    render(<StatusHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("profile-status").textContent).toBe(
        "unavailable",
      ),
    );
    expect(getApplicantProfile).not.toHaveBeenCalled();
  });

  it("updates mounted consumers immediately after the shared cache changes", async () => {
    render(<StatusHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("profile-status").textContent).toBe("missing"),
    );

    act(() => setApplicantProfileCache(profile));

    expect(screen.getByTestId("profile-status").textContent).toBe("exists");
  });

  it("shares the in-flight profile request between consumers", async () => {
    render(
      <>
        <StatusHarness />
        <StatusHarness />
      </>,
    );

    await waitFor(() =>
      expect(
        screen
          .getAllByTestId("profile-status")
          .every((element) => element.textContent === "missing"),
      ).toBe(true),
    );
    expect(getApplicantProfile).toHaveBeenCalledTimes(1);
  });
});
