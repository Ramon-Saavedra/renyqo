import { apiGet, apiPost, apiPostJsonVoid, apiPostVoid } from "./client";
import { getCsrfToken } from "./csrf";
import {
  resolveOnboardingPath as resolveRedirectPath,
  type OnboardingNextStep,
} from "@/lib/onboarding";

export { type OnboardingNextStep, resolveRedirectPath };

export type UserRole = "applicant" | "provider";
export type ProviderType = "private" | "company";

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
  readonly providerType?: ProviderType;
  readonly companyName?: string;
  readonly acceptedTerms: true;
  readonly acceptedPrivacy: true;
}

interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface ForgotPasswordPayload {
  readonly email: string;
}

export interface ResetPasswordPayload {
  readonly token: string;
  readonly newPassword: string;
}

export async function register(payload: RegisterPayload): Promise<SafeUser> {
  const user = await apiPost<SafeUser>("/api/v1/auth/register", payload);
  await getCsrfToken(true);
  return user;
}

export async function login(payload: LoginPayload): Promise<SafeUser> {
  const user = await apiPost<SafeUser>("/api/v1/auth/login", payload);
  await getCsrfToken(true);
  return user;
}

export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<void> {
  return apiPostJsonVoid("/api/v1/auth/forgot-password", {
    email: payload.email,
  });
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<void> {
  return apiPostJsonVoid("/api/v1/auth/reset-password", payload);
}

export async function getOnboardingState(): Promise<OnboardingState> {
  return apiGet<OnboardingState>("/api/v1/me/onboarding-state");
}

export async function getCurrentUser(): Promise<SafeUser> {
  return apiGet<SafeUser>("/api/v1/auth/me");
}

export async function logout(): Promise<void> {
  await apiPostVoid("/api/v1/auth/logout");
  await getCsrfToken(true);
}
