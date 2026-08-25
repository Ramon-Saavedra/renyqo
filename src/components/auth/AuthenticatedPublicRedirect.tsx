"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { isApplicantRole, isProviderRole } from "@/features/auth/utils/role";

interface AuthenticatedPublicRedirectProps {
  children: React.ReactNode;
}

const AUTH_LOADING_LABEL = "Inhalt wird geladen";

function AuthSessionSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-md flex-col gap-3 px-gutter py-section"
    >
      <span className="sr-only">{AUTH_LOADING_LABEL}</span>
      <RenyqoSkeleton height={28} width="45%" />
      <RenyqoSkeleton height={12} width="70%" />
      <RenyqoSkeleton height={44} className="w-full rounded-md" />
      <RenyqoSkeleton height={44} className="w-full rounded-md" />
    </div>
  );
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

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  if (loading) return <AuthSessionSkeleton />;
  if (!user) return <>{children}</>;

  if (isApplicantRole(user.role) || isProviderRole(user.role)) {
    return <AuthSessionSkeleton />;
  }

  return <>{children}</>;
}
