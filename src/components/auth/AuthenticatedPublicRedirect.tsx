"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { isApplicantRole } from "@/features/auth/utils/role";

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
      if (active) router.replace("/listings");
      return () => {
        active = false;
      };
    }

    getOnboardingState()
      .then(({ nextStep }) => {
        if (active) router.replace(resolveRedirectPath(nextStep));
      })
      .catch(() => {
        if (active) router.replace("/provider/dashboard");
      });

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  if (loading || user) return null;
  return <>{children}</>;
}
