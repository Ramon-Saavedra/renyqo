"use client";

import { useEffect, useState } from "react";
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
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setRedirecting(false);
      return;
    }

    let active = true;
    setRedirecting(true);

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

  if (loading || redirecting) return null;
  return <>{children}</>;
}
