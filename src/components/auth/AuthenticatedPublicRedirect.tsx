"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { isApplicantRole, isProviderRole } from "@/features/auth/utils/role";

interface AuthenticatedPublicRedirectProps {
  children: React.ReactNode;
}

export function AuthenticatedPublicRedirect({
  children,
}: AuthenticatedPublicRedirectProps) {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !user) return;

    let active = true;

    if (isApplicantRole(user.role)) {
      router.replace("/listings");
      return () => {
        active = false;
      };
    }

    if (isProviderRole(user.role)) {
      getOnboardingState()
        .then(({ nextStep }) => {
          if (active) router.replace(resolveRedirectPath(nextStep));
        })
        .catch(() => {
          if (active) router.replace("/provider/dashboard");
        });
    }

    // Unknown or invalid role — stay on the public page, do not redirect.

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  if (loading) return null;
  if (!user) return <>{children}</>;

  // Hide content only for known roles that will be redirected.
  if (isApplicantRole(user.role) || isProviderRole(user.role)) return null;

  return <>{children}</>;
}
