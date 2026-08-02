import { Building, Lock } from "lucide-react";
import { type Role } from "@/features/auth/copy/account-type";

export const ROLE_GLYPHS = {
  applicant: Lock,
  provider: Building,
} as const;

export function resolveRole(value: string | undefined): Role {
  return value?.trim().toLowerCase() === "provider" ? "provider" : "applicant";
}

export function isApplicantRole(role: string | undefined): boolean {
  return role?.trim().toLowerCase() === "applicant";
}

export function isProviderRole(role: string | undefined): boolean {
  return role?.trim().toLowerCase() === "provider";
}
