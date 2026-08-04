export type OnboardingNextStep =
  | "applicant_area_pending"
  | "browse_listings"
  | "create_first_listing"
  | "dashboard";

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
