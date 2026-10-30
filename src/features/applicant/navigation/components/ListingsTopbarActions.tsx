"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopbarAccountSection } from "@/components/layout/app-topbar/TopbarAccountSection";
import { SessionPendingTopbarActions } from "@/components/layout/app-topbar/SessionPendingTopbarActions";
import { buttonClass } from "@/components/ui/button/Button";
import { isApplicantRole, isProviderRole } from "@/features/auth/utils/role";
import { getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import {
  isConfirmedAnonymousUser,
  useCurrentUser,
} from "@/lib/api/use-current-user";

function ProviderRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

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
  }, [router]);

  return null;
}

export function ListingsTopbarActions() {
  const { user, loading, error } = useCurrentUser();

  if (loading || error) {
    return <SessionPendingTopbarActions />;
  }

  if (isConfirmedAnonymousUser({ user, loading, error }) || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className={buttonClass("ghost")}>
          Anmelden
        </Link>
        <Link href="/register/account-type" className={buttonClass("primary")}>
          Registrieren
        </Link>
      </div>
    );
  }

  if (isApplicantRole(user.role)) {
    return <TopbarAccountSection role="applicant" />;
  }

  if (isProviderRole(user.role)) {
    return <ProviderRedirect />;
  }

  // Unknown role — show public actions as a safe fallback.
  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className={buttonClass("ghost")}>
        Anmelden
      </Link>
      <Link href="/register/account-type" className={buttonClass("primary")}>
        Registrieren
      </Link>
    </div>
  );
}
