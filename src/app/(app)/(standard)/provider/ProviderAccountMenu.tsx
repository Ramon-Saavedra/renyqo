"use client";

import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";

const COMPACT_ACCOUNT_PATH = "/provider/listings/new";

export function ProviderAccountMenu() {
  const pathname = usePathname();

  return (
    <AccountMenu
      variant={pathname === COMPACT_ACCOUNT_PATH ? "compact" : "full"}
    />
  );
}
