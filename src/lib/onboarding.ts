export const ONBOARDING_NEXT_STEPS = [
  "applicant_area_pending",
  "browse_listings",
  "create_first_listing",
  "dashboard",
] as const;

export type OnboardingNextStep = (typeof ONBOARDING_NEXT_STEPS)[number];

export function parseOnboardingNextStep(
  value: unknown,
): OnboardingNextStep | null {
  if (typeof value !== "string") return null;
  return (ONBOARDING_NEXT_STEPS as readonly string[]).includes(value)
    ? (value as OnboardingNextStep)
    : null;
}

export function resolveOnboardingPath(nextStep: OnboardingNextStep): string {
  switch (nextStep) {
    case "applicant_area_pending":
    case "browse_listings":
      return "/listings";
    case "create_first_listing":
      return "/provider/get-started";
    case "dashboard":
      return "/provider/dashboard";
  }
}
