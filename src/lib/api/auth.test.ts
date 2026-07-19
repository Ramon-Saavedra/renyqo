import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet, apiPost, apiPostJsonVoid, apiPostVoid } from "./client";
import {
  getCurrentUser,
  forgotPassword,
  getOnboardingState,
  login,
  resetPassword,
  logout,
  register,
  resolveRedirectPath,
} from "./auth";

vi.mock("./client", () => ({
  apiPost: vi.fn(),
  apiPostJsonVoid: vi.fn(),
  apiPostVoid: vi.fn(),
  apiGet: vi.fn(),
}));

describe("resolveRedirectPath", () => {
  it("maps applicant_area_pending to /dashboard", () => {
    expect(resolveRedirectPath("applicant_area_pending")).toBe("/dashboard");
  });

  it("maps browse_listings to /listings", () => {
    expect(resolveRedirectPath("browse_listings")).toBe("/listings");
  });

  it("maps create_first_listing to /provider/get-started", () => {
    expect(resolveRedirectPath("create_first_listing")).toBe(
      "/provider/get-started",
    );
  });

  it("maps dashboard to /provider/dashboard", () => {
    expect(resolveRedirectPath("dashboard")).toBe("/provider/dashboard");
  });
});

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiPost with the register endpoint and full payload", async () => {
    vi.mocked(apiPost).mockResolvedValue({} as never);

    await register({
      name: "Test User",
      email: "test@test.de",
      password: "Secure1!pass",
      role: "applicant",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/auth/register", {
      name: "Test User",
      email: "test@test.de",
      password: "Secure1!pass",
      role: "applicant",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
  });

  it("passes provider identity fields for provider registration", async () => {
    vi.mocked(apiPost).mockResolvedValue({} as never);

    await register({
      name: "Provider User",
      email: "provider@test.de",
      password: "Secure1!pass",
      role: "provider",
      providerType: "company",
      companyName: "Renyqo Immobilien",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/auth/register", {
      name: "Provider User",
      email: "provider@test.de",
      password: "Secure1!pass",
      role: "provider",
      providerType: "company",
      companyName: "Renyqo Immobilien",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
  });

  it("returns the SafeUser resolved by apiPost", async () => {
    const user = {
      id: "abc",
      name: "Test User",
      email: "test@test.de",
      role: "applicant" as const,
      providerType: null,
      companyName: null,
    };
    vi.mocked(apiPost).mockResolvedValue(user as never);

    await expect(
      register({
        name: "Test User",
        email: "test@test.de",
        password: "Secure1!pass",
        role: "applicant",
        acceptedTerms: true,
        acceptedPrivacy: true,
      }),
    ).resolves.toEqual(user);
  });

  it("propagates errors thrown by apiPost", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("network"));

    await expect(
      register({
        name: "Test",
        email: "t@t.de",
        password: "pass",
        role: "provider",
        acceptedTerms: true,
        acceptedPrivacy: true,
      }),
    ).rejects.toThrow("network");
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiPost with the login endpoint and credentials", async () => {
    vi.mocked(apiPost).mockResolvedValue({} as never);

    await login({ email: "test@test.de", password: "pass123" });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/auth/login", {
      email: "test@test.de",
      password: "pass123",
    });
  });

  it("returns the SafeUser resolved by apiPost", async () => {
    const user = {
      id: "1",
      name: "Test",
      email: "t@t.de",
      role: "provider" as const,
      providerType: "private" as const,
      companyName: null,
    };
    vi.mocked(apiPost).mockResolvedValue(user as never);

    await expect(login({ email: "t@t.de", password: "pass" })).resolves.toEqual(
      user,
    );
  });
});

describe("password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the email to the neutral forgot-password endpoint", async () => {
    vi.mocked(apiPostJsonVoid).mockResolvedValue(undefined);

    await forgotPassword({ email: "test@test.de" });

    expect(apiPostJsonVoid).toHaveBeenCalledWith(
      "/api/v1/auth/forgot-password",
      { email: "test@test.de" },
    );
  });

  it("sends the reset token and new password to the reset endpoint", async () => {
    vi.mocked(apiPostJsonVoid).mockResolvedValue(undefined);

    await resetPassword({ token: "reset-token", newPassword: "Secure123!" });

    expect(apiPostJsonVoid).toHaveBeenCalledWith(
      "/api/v1/auth/reset-password",
      { token: "reset-token", newPassword: "Secure123!" },
    );
  });
});

describe("getOnboardingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiGet with the onboarding state endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValue({} as never);

    await getOnboardingState();

    expect(apiGet).toHaveBeenCalledWith("/api/v1/me/onboarding-state");
  });

  it("returns the onboarding state resolved by apiGet", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      nextStep: "create_first_listing",
    } as never);

    await expect(getOnboardingState()).resolves.toEqual({
      nextStep: "create_first_listing",
    });
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiGet with the current user endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValue({} as never);

    await getCurrentUser();

    expect(apiGet).toHaveBeenCalledWith("/api/v1/auth/me");
  });

  it("returns the SafeUser resolved by apiGet", async () => {
    const user = {
      id: "provider-1",
      name: "Ramon Saavedra",
      email: "ramon@example.com",
      role: "provider" as const,
      providerType: "company" as const,
      companyName: "Renyqo Immobilien",
    };
    vi.mocked(apiGet).mockResolvedValue(user as never);

    await expect(getCurrentUser()).resolves.toEqual(user);
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiPostVoid with the logout endpoint", async () => {
    vi.mocked(apiPostVoid).mockResolvedValue(undefined);

    await logout();

    expect(apiPostVoid).toHaveBeenCalledWith("/api/v1/auth/logout");
  });

  it("propagates errors thrown by apiPostVoid", async () => {
    vi.mocked(apiPostVoid).mockRejectedValue(new Error("logout failed"));

    await expect(logout()).rejects.toThrow("logout failed");
  });
});
