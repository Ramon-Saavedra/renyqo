import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "../proxy";

const fetchMock = vi.fn();

function createRequest(
  pathname = "/provider/listings/new",
  cookie = "session=provider",
) {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { cookie },
  });
}

function onboardingResponse(nextStep: string, status = 200) {
  return new Response(JSON.stringify({ nextStep }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function userResponse(role: string, status = 200) {
  return new Response(JSON.stringify({ role }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthenticatedResponse() {
  return new Response(null, { status: 401 });
}

function getRedirectPath(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("applicant route proxy", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects anonymous users from /applicant/profile to /login", async () => {
    fetchMock.mockResolvedValueOnce(unauthenticatedResponse());

    const response = await proxy(createRequest("/applicant/profile", ""));

    expect(response.status).toBe(307);
    expect(getRedirectPath(response)).toBe("/login");
  });

  it("appends session=expired query when auth/me returns 401", async () => {
    fetchMock.mockResolvedValueOnce(unauthenticatedResponse());

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(location).toContain("/login?session=expired");
  });

  it("allows authenticated applicants to access /applicant/profile", async () => {
    fetchMock.mockResolvedValueOnce(userResponse("applicant"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns 503 when auth/me is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network failure"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(503);
  });

  it("accepts uppercase APPLICANT role from backend", async () => {
    fetchMock.mockResolvedValueOnce(userResponse("APPLICANT"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("returns 503 on invalid role payload", async () => {
    fetchMock.mockResolvedValueOnce(userResponse("admin"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(503);
  });

  it("returns 503 when auth/me responds 5xx", async () => {
    fetchMock.mockResolvedValueOnce(userResponse("applicant", 500));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(503);
  });

  it.each(["create_first_listing", "dashboard"])(
    "redirects provider from /applicant/profile to provider flow for nextStep=%s",
    async (nextStep) => {
      fetchMock
        .mockResolvedValueOnce(userResponse("provider"))
        .mockResolvedValueOnce(onboardingResponse(nextStep));

      const response = await proxy(
        createRequest("/applicant/profile", "session=provider"),
      );

      const expected =
        nextStep === "dashboard"
          ? "/provider/dashboard"
          : "/provider/get-started";
      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe(expected);
    },
  );

  it("redirects provider from /applicant/profile to dashboard when onboarding fails", async () => {
    fetchMock
      .mockResolvedValueOnce(userResponse("provider"))
      .mockRejectedValueOnce(new Error("network failure"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=provider"),
    );

    expect(response.status).toBe(307);
    expect(getRedirectPath(response)).toBe("/provider/dashboard");
  });

  describe("exact /applicant route", () => {
    it("redirects anonymous users from /applicant to /login", async () => {
      fetchMock.mockResolvedValueOnce(unauthenticatedResponse());

      const response = await proxy(createRequest("/applicant", ""));

      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe("/login");
    });

    it("redirects authenticated applicants from /applicant to /listings", async () => {
      fetchMock.mockResolvedValueOnce(userResponse("applicant"));

      const response = await proxy(
        createRequest("/applicant", "session=applicant"),
      );

      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe("/listings");
    });

    it("redirects providers from /applicant to provider flow", async () => {
      fetchMock
        .mockResolvedValueOnce(userResponse("provider"))
        .mockResolvedValueOnce(onboardingResponse("dashboard"));

      const response = await proxy(
        createRequest("/applicant", "session=provider"),
      );

      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe("/provider/dashboard");
    });
  });

  it("returns 503 when the fetch is aborted", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    const response = await proxy(
      createRequest("/applicant/profile", "session=applicant"),
    );

    expect(response.status).toBe(503);
  });
});

describe("provider route proxy", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects unauthenticated users to login", async () => {
    fetchMock.mockResolvedValueOnce(onboardingResponse("", 401));

    const response = await proxy(createRequest("/provider/listings/new", ""));

    expect(response.status).toBe(307);
    expect(getRedirectPath(response)).toBe("/login");
  });

  it.each(["applicant_area_pending", "browse_listings"])(
    "redirects applicants to listings for nextStep=%s",
    async (nextStep) => {
      fetchMock.mockResolvedValueOnce(onboardingResponse(nextStep));

      const response = await proxy(
        createRequest("/provider/listings/new", "session=applicant"),
      );

      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe("/listings");
    },
  );

  it.each(["create_first_listing", "dashboard"])(
    "allows providers to access routes for nextStep=%s",
    async (nextStep) => {
      fetchMock.mockResolvedValueOnce(onboardingResponse(nextStep));

      const response = await proxy(createRequest());

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("redirects completed providers from get-started to dashboard", async () => {
    fetchMock
      .mockResolvedValueOnce(onboardingResponse("dashboard"))
      .mockResolvedValueOnce(onboardingResponse("dashboard"));

    const response = await proxy(createRequest("/provider/get-started"));

    expect(response.status).toBe(307);
    expect(getRedirectPath(response)).toBe("/provider/dashboard");

    const dashboardResponse = await proxy(createRequest("/provider/dashboard"));

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    ["applicant_area_pending", "/listings"],
    ["browse_listings", "/listings"],
    ["create_first_listing", "/provider/get-started"],
    ["dashboard", "/provider/dashboard"],
  ])(
    "redirects authenticated users from login for nextStep=%s",
    async (nextStep, target) => {
      fetchMock.mockResolvedValueOnce(onboardingResponse(nextStep));

      const response = await proxy(createRequest("/login"));

      expect(response.status).toBe(307);
      expect(getRedirectPath(response)).toBe(target);
    },
  );

  it("allows unauthenticated users to access login", async () => {
    fetchMock.mockResolvedValueOnce(onboardingResponse("", 401));

    const response = await proxy(createRequest("/login", ""));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows login when the onboarding lookup fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network failure"));

    const response = await proxy(createRequest("/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects to login when the session lookup fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network failure"));

    const response = await proxy(createRequest());

    expect(response.status).toBe(307);
    expect(getRedirectPath(response)).toBe("/login");
  });

  it("forwards the request cookie to the backend session lookup", async () => {
    fetchMock.mockResolvedValueOnce(onboardingResponse("dashboard"));

    await proxy(createRequest("/provider/listings/new", "session=provider"));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/me/onboarding-state"),
      expect.objectContaining({
        headers: { cookie: "session=provider" },
        cache: "no-store",
      }),
    );
  });

  it("matches every provider, login and applicant route", () => {
    expect(config.matcher).toEqual([
      "/login",
      "/provider/:path*",
      "/applicant/:path*",
    ]);
  });
});
