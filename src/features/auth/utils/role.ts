import { Building, Lock } from "lucide-react";
import { type Role } from "@/features/auth/copy/account-type";

export const ROLE_GLYPHS = {
  applicant: Lock,
  provider: Building,
} as const;

export function resolveRole(value: string | undefined): Role {
  return value === "provider" ? "provider" : "applicant";
}
