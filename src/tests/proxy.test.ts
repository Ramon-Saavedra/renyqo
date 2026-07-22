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

function getRedirectPath(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

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
    ["applicant_area_pending", "/dashboard"],
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

  it("matches every provider route", () => {
    expect(config.matcher).toEqual(["/login", "/provider/:path*"]);
  });
});
