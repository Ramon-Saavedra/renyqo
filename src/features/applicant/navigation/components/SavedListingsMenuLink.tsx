"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "@/features/applicant/listings/copy/listings";

const LINK_CLASS =
  "mt-3 flex w-full items-center gap-2 rounded-sm border border-border bg-background-muted px-3 py-2 text-caption font-medium text-foreground-secondary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function SavedListingsMenuLink() {
  return (
    <Link href="/applicant/saved" className={LINK_CLASS}>
      <AppIcon icon={Bookmark} size={14} strokeWidth={1.6} decorative />
      <span>{listingsCopy.saved.menuLabel}</span>
    </Link>
  );
}
