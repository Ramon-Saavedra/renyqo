"use client";

import { useEffect, useState } from "react";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { getCurrentUser } from "@/lib/api/auth";
import type { SafeUser } from "@/lib/api/auth";
import { buildWelcomeGreeting } from "../utils/greeting";

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly user: SafeUser | null };

export function WelcomeGreeting() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((user) => {
        if (active) setState({ status: "ready", user });
      })
      .catch(() => {
        if (active) setState({ status: "ready", user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return <RenyqoSkeleton variant="pill" width={180} height={11} />;
  }

  return <>{buildWelcomeGreeting(state.user)}</>;
}
