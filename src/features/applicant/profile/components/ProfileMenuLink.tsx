"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileUser } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { applicantProfileCopy } from "../copy/applicant-profile";
import { useApplicantProfileStatus } from "../hooks/useApplicantProfileStatus";
import { buildProfileHref } from "../utils/profile-href";

const LINK_CLASS =
  "mt-3 flex w-full items-center gap-2 rounded-sm border border-border bg-background-subtle px-3 py-2 text-caption font-medium text-foreground-secondary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function ProfileMenuLink() {
  const pathname = usePathname();
  const status = useApplicantProfileStatus();

  if (status === "loading") {
    return <RenyqoSkeleton height={34} className="mt-3 w-full" />;
  }

  if (status === "unavailable") return null;

  const label =
    status === "exists"
      ? applicantProfileCopy.cta.edit
      : applicantProfileCopy.cta.create;

  return (
    <Link href={buildProfileHref(pathname)} className={LINK_CLASS}>
      <AppIcon icon={FileUser} size={14} strokeWidth={1.6} decorative />
      <span>{label}</span>
    </Link>
  );
}
