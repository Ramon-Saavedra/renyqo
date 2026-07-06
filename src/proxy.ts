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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${API_URL}/api/v1/me/onboarding-state`, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const data = (await res.json()) as { nextStep: OnboardingNextStep };

    if (!PROVIDER_STEPS.has(data.nextStep)) {
      const target =
        data.nextStep === "applicant_area_pending" ||
        data.nextStep === "browse_listings"
          ? "/listings"
          : "/login";
      return NextResponse.redirect(new URL(target, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/provider/:path*"],
};
