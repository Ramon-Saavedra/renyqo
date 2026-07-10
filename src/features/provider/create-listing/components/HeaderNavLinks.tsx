"use client";

import Link from "next/link";
import { Building2, LayoutGrid } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { createListingCopy } from "../copy/create-listing";

interface HeaderNavLinksProps {
  hasUnsavedChanges: boolean;
}

const NAV_CLASS = "mb-6 flex items-center justify-end gap-5";
const LINK_CLASS =
  "inline-flex items-center gap-1.5 text-caption text-foreground-tertiary transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

export function HeaderNavLinks({ hasUnsavedChanges }: HeaderNavLinksProps) {
  const copy = createListingCopy.headerNav;

  const guardNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges && !window.confirm(copy.leaveConfirm)) {
      event.preventDefault();
    }
  };

  return (
    <nav className={NAV_CLASS} aria-label={copy.dashboard}>
      <Link
        href={copy.myListingsHref}
        className={LINK_CLASS}
        onClick={guardNavigation}
      >
        <AppIcon icon={Building2} size={13} strokeWidth={1.6} decorative />
        {copy.myListings}
      </Link>
      <Link
        href={copy.dashboardHref}
        className={LINK_CLASS}
        onClick={guardNavigation}
      >
        <AppIcon icon={LayoutGrid} size={13} strokeWidth={1.6} decorative />
        {copy.dashboard}
      </Link>
    </nav>
  );
}
