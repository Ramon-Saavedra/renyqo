"use client";

import { isApplicantRole } from "@/features/auth/utils/role";
import type { SafeUser } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";

export type ListingViewerSessionStatus =
  | "loading"
  | "anonymous"
  | "applicant"
  | "other"
  | "error";

export function resolveListingViewerSession(
  user: SafeUser | null,
  loading: boolean,
  error = false,
): ListingViewerSessionStatus {
  if (loading) return "loading";
  if (error) return "error";
  if (!user) return "anonymous";
  if (isApplicantRole(user.role)) return "applicant";
  return "other";
}

export function useListingViewerSession(): ListingViewerSessionStatus {
  const { user, loading, error } = useCurrentUser();
  return resolveListingViewerSession(user, loading, error);
}
