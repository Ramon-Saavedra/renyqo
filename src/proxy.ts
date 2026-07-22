import { NextResponse, type NextRequest } from "next/server";

type OnboardingNextStep =
  | "applicant_area_pending"
  | "browse_listings"
  | "create_first_listing"
  | "dashboard";

const PROVIDER_STEPS: ReadonlySet<OnboardingNextStep> = new Set([
  "create_first_listing",
  "dashboard",
]);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getRedirectPath(nextStep: OnboardingNextStep): string {
  switch (nextStep) {
    case "applicant_area_pending":
      return "/dashboard";
    case "browse_listings":
      return "/listings";
    case "create_first_listing":
      return "/provider/get-started";
    case "dashboard":
      return "/provider/dashboard";
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const cookie = request.headers.get("cookie") ?? "";
  const { pathname } = request.nextUrl;

  try {
    const res = await fetch(`${API_URL}/api/v1/me/onboarding-state`, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    });

    if (!res.ok) {
      if (pathname === "/login") return NextResponse.next();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const data = (await res.json()) as { nextStep: OnboardingNextStep };

    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL(getRedirectPath(data.nextStep), request.url),
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
  matcher: ["/login", "/provider/:path*"],
};
