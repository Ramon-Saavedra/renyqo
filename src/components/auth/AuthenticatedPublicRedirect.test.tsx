import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOnboardingState } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { AuthenticatedPublicRedirect } from "./AuthenticatedPublicRedirect";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/api/auth", () => ({
  getOnboardingState: vi.fn(),
  resolveRedirectPath: vi.fn((nextStep: string) =>
    nextStep === "dashboard" ? "/provider/dashboard" : "/provider/get-started",
  ),
}));

vi.mock("@/lib/api/use-current-user", () => ({
  useCurrentUser: vi.fn(),
}));

const currentUser = vi.mocked(useCurrentUser);
const onboarding = vi.mocked(getOnboardingState);

describe("AuthenticatedPublicRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render public content while authentication is loading", () => {
    currentUser.mockReturnValue({ user: null, loading: true });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    expect(screen.queryByText("public content")).toBeNull();
  });

  it("redirects applicants to listings without rendering public content", async () => {
    currentUser.mockReturnValue({
      user: {
        id: "applicant-1",
        name: "Anna Beispiel",
        email: "anna@example.com",
        role: "applicant",
        providerType: null,
        companyName: null,
      },
      loading: false,
    });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/listings"));
    expect(screen.queryByText("public content")).toBeNull();
    expect(onboarding).not.toHaveBeenCalled();
  });

  it("uses the existing onboarding route for providers", async () => {
    currentUser.mockReturnValue({
      user: {
        id: "provider-1",
        name: "Peter Beispiel",
        email: "peter@example.com",
        role: "provider",
        providerType: "private",
        companyName: null,
      },
      loading: false,
    });
    onboarding.mockResolvedValue({ nextStep: "dashboard" });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/provider/dashboard"),
    );
    expect(screen.queryByText("public content")).toBeNull();
  });

  it("renders public content for unauthenticated users", () => {
    currentUser.mockReturnValue({ user: null, loading: false });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    expect(screen.getByText("public content")).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
