import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOnboardingState } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  useCurrentUser,
} from "@/lib/api/use-current-user";
import type * as currentUserApi from "@/lib/api/use-current-user";
import { currentUserSessionCopy } from "./current-user-session-copy";
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

vi.mock("@/lib/api/use-current-user", async (importOriginal) => {
  const actual = await importOriginal<typeof currentUserApi>();
  return {
    ...actual,
    useCurrentUser: vi.fn(),
    invalidateCurrentUser: vi.fn(),
  };
});

const currentUser = vi.mocked(useCurrentUser);
const retrySession = vi.mocked(invalidateCurrentUser);
const onboarding = vi.mocked(getOnboardingState);

describe("AuthenticatedPublicRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render public content while authentication is loading", () => {
    currentUser.mockReturnValue({ user: null, loading: true, error: false });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    expect(screen.queryByText("public content")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Inhalt wird geladen",
    );
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
      error: false,
    });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/listings"));
    expect(screen.queryByText("public content")).toBeNull();
    expect(screen.getByRole("status")).toBeInstanceOf(HTMLElement);
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
      error: false,
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
    expect(screen.getByRole("status")).toBeInstanceOf(HTMLElement);
  });

  it("falls back to the provider dashboard when onboarding lookup fails", async () => {
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
      error: false,
    });
    onboarding.mockRejectedValue(new Error("onboarding unavailable"));

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/provider/dashboard"),
    );
    expect(screen.queryByText("public content")).toBeNull();
    expect(screen.getByRole("status")).toBeInstanceOf(HTMLElement);
  });

  it("stays on the public page for users with an invalid role", async () => {
    currentUser.mockReturnValue({
      user: {
        id: "u1",
        name: "X",
        email: "x@x.de",
        role: "admin",
        providerType: null,
        companyName: null,
      } as never,
      loading: false,
      error: false,
    });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    await waitFor(() => expect(onboarding).not.toHaveBeenCalled());
    expect(screen.getByText("public content")).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders public content for a confirmed anonymous session", () => {
    currentUser.mockReturnValue({ user: null, loading: false, error: false });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    expect(screen.getByText("public content")).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not render public content when the session lookup fails", async () => {
    currentUser.mockReturnValue({ user: null, loading: false, error: true });

    render(
      <AuthenticatedPublicRedirect>
        <span>public content</span>
      </AuthenticatedPublicRedirect>,
    );

    expect(screen.queryByText("public content")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      currentUserSessionCopy.error,
    );
    expect(replace).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: currentUserSessionCopy.retry }),
    );
    expect(retrySession).toHaveBeenCalledTimes(1);
  });
});
