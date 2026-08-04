import { Building, Lock } from "lucide-react";
import { type Role } from "@/features/auth/copy/account-type";
import { normalizeRole } from "@/lib/normalize-role";

export const ROLE_GLYPHS = {
  applicant: Lock,
  provider: Building,
} as const;

export function resolveRole(value: string | undefined): Role {
  return normalizeRole(value) ?? "applicant";
}

export function isApplicantRole(role: string | undefined): boolean {
  return normalizeRole(role) === "applicant";
}

export function isProviderRole(role: string | undefined): boolean {
  return normalizeRole(role) === "provider";
}
