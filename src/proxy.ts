import { NextResponse, type NextRequest } from "next/server";
import { normalizeRole } from "@/lib/normalize-role";
import {
  resolveOnboardingPath,
  type OnboardingNextStep,
} from "@/lib/onboarding";
import type { UserRole } from "@/lib/api/auth";

const PROVIDER_STEPS: ReadonlySet<OnboardingNextStep> = new Set([
  "create_first_listing",
  "dashboard",
]);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const PROXY_FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

type RoleResult =
  | { role: UserRole }
  | { unauthenticated: true }
  | { error: true };

async function fetchUserRole(cookie: string): Promise<RoleResult> {
  let res: globalThis.Response;
  try {
    res = await fetchWithTimeout(`${API_URL}/api/v1/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
  } catch {
    return { error: true };
  }

  if (res.status === 401) return { unauthenticated: true };

  if (!res.ok) return { error: true };

  try {
    const user = (await res.json()) as { role: unknown };
    const role = normalizeRole(
      typeof user.role === "string" ? user.role : undefined,
    );
    if (role === null) return { error: true };
    return { role };
  } catch {
    return { error: true };
  }
}

async function fetchOnboardingStep(
  cookie: string,
): Promise<OnboardingNextStep | null> {
  try {
    const res = await fetchWithTimeout(
      `${API_URL}/api/v1/me/onboarding-state`,
      {
        headers: { cookie },
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { nextStep: OnboardingNextStep };
    return data.nextStep;
  } catch {
    return null;
  }
}

const UNAVAILABLE = new NextResponse("Service Unavailable", {
  status: 503,
  headers: { "Content-Type": "text/plain" },
});

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const cookie = request.headers.get("cookie") ?? "";
  const { pathname } = request.nextUrl;

  // ── Applicant routes — protect by role ──
  const isApplicantRoute =
    pathname === "/applicant" || pathname.startsWith("/applicant/");

  if (isApplicantRoute) {
    const result = await fetchUserRole(cookie);

    if ("error" in result) {
      return UNAVAILABLE;
    }

    if ("unauthenticated" in result) {
      return NextResponse.redirect(
        new URL("/login?session=expired", request.url),
      );
    }

    if (result.role === "applicant") {
      if (pathname === "/applicant") {
        return NextResponse.redirect(new URL("/listings", request.url));
      }
      return NextResponse.next();
    }

    // result.role === "provider" — redirect to provider onboarding
    const nextStep = await fetchOnboardingStep(cookie);
    if (nextStep) {
      return NextResponse.redirect(
        new URL(resolveOnboardingPath(nextStep), request.url),
      );
    }
    return NextResponse.redirect(new URL("/provider/dashboard", request.url));
  }

  // ── Existing logic for /login and /provider/:path* ──
  try {
    const res = await fetchWithTimeout(
      `${API_URL}/api/v1/me/onboarding-state`,
      {
        method: "GET",
        headers: { cookie },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      if (pathname === "/login") return NextResponse.next();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const data = (await res.json()) as { nextStep: OnboardingNextStep };

    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL(resolveOnboardingPath(data.nextStep), request.url),
      );
    }

    if (!PROVIDER_STEPS.has(data.nextStep)) {
      const target =
        data.nextStep === "applicant_area_pending" ||
        data.nextStep === "browse_listings"
          ? "/listings"
          : "/login";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname === "/provider/get-started" && data.nextStep === "dashboard") {
      return NextResponse.redirect(new URL("/provider/dashboard", request.url));
    }
  } catch {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/provider/:path*", "/applicant/:path*"],
};
