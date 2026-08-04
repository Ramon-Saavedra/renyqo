"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import { buttonClass } from "@/components/ui/button/Button";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { isApplicantRole, isProviderRole } from "@/features/auth/utils/role";

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

const SKELETON_CLASS = "flex items-center gap-3.5";

export function ListingsTopbarActions() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <span className={SKELETON_CLASS}>
        <RenyqoSkeleton variant="pill" width={96} height={32} />
        <RenyqoSkeleton variant="circle" width={32} height={32} />
      </span>
    );
  }

  if (!user) {
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
    return <AccountMenu />;
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
