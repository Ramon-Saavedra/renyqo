"use client";

import { usePathname } from "next/navigation";
import { TopbarAccountSection } from "@/components/layout/app-topbar/TopbarAccountSection";

const COMPACT_ACCOUNT_PATH = "/provider/listings/new";

export function ProviderAccountMenu() {
  const pathname = usePathname();

  return (
    <TopbarAccountSection
      role="provider"
      accountMenu={{
        variant: pathname === COMPACT_ACCOUNT_PATH ? "compact" : "full",
      }}
    />
  );
}
