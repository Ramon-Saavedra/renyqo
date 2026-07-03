import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet, apiPost } from "./client";
import {
  getOnboardingState,
  login,
  register,
  resolveRedirectPath,
} from "./auth";

vi.mock("./client", () => ({
  apiPost: vi.fn(),
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

  it("returns the SafeUser resolved by apiPost", async () => {
    const user = {
      id: "abc",
      name: "Test User",
      email: "test@test.de",
      role: "applicant" as const,
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
    };
    vi.mocked(apiPost).mockResolvedValue(user as never);

    await expect(login({ email: "t@t.de", password: "pass" })).resolves.toEqual(
      user,
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
