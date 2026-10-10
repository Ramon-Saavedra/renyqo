"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicationsCopy } from "@/features/applicant/applications/copy";

const LINK_CLASS =
  "mt-3 flex w-full items-center gap-2 rounded-sm border border-border bg-background-muted px-3 py-2 text-caption font-medium text-foreground-secondary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function ApplicationsMenuLink() {
  return (
    <Link href="/applicant/applications" className={LINK_CLASS}>
      <AppIcon icon={FileText} size={14} strokeWidth={1.6} decorative />
      <span>{applicationsCopy.overview.title}</span>
    </Link>
  );
}
