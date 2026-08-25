import { describe, expect, it } from "vitest";
import { parseOnboardingNextStep, resolveOnboardingPath } from "./onboarding";

describe("parseOnboardingNextStep", () => {
  it.each([
    "applicant_area_pending",
    "browse_listings",
    "create_first_listing",
    "dashboard",
  ] as const)("accepts known nextStep=%s", (nextStep) => {
    expect(parseOnboardingNextStep(nextStep)).toBe(nextStep);
  });

  it.each([undefined, null, 1, {}, "", "admin", "CREATE_FIRST_LISTING"])(
    "rejects invalid nextStep value %p",
    (value) => {
      expect(parseOnboardingNextStep(value)).toBeNull();
    },
  );
});

describe("resolveOnboardingPath", () => {
  it.each([
    ["applicant_area_pending", "/listings"],
    ["browse_listings", "/listings"],
    ["create_first_listing", "/provider/get-started"],
    ["dashboard", "/provider/dashboard"],
  ] as const)("maps %s to %s", (nextStep, path) => {
    expect(resolveOnboardingPath(nextStep)).toBe(path);
  });
});
