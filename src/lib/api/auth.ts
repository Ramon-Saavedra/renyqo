import { apiGet, apiPost, apiPostVoid } from "./client";

export type UserRole = "applicant" | "provider";
export type ProviderType = "private" | "company";

export type OnboardingNextStep =
  | "applicant_area_pending"
  | "browse_listings"
  | "create_first_listing"
  | "dashboard";

export interface SafeUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly providerType: ProviderType | null;
  readonly companyName: string | null;
}

export interface OnboardingState {
  readonly nextStep: OnboardingNextStep;
}

interface RegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly acceptedTerms: true;
  readonly acceptedPrivacy: true;
}

interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export function resolveRedirectPath(nextStep: OnboardingNextStep): string {
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

export async function register(payload: RegisterPayload): Promise<SafeUser> {
  return apiPost<SafeUser>("/api/v1/auth/register", payload);
}

export async function login(payload: LoginPayload): Promise<SafeUser> {
  return apiPost<SafeUser>("/api/v1/auth/login", payload);
}

export async function getOnboardingState(): Promise<OnboardingState> {
  return apiGet<OnboardingState>("/api/v1/me/onboarding-state");
}

export async function getCurrentUser(): Promise<SafeUser> {
  return apiGet<SafeUser>("/api/v1/auth/me");
}

export async function logout(): Promise<void> {
  return apiPostVoid("/api/v1/auth/logout");
}
