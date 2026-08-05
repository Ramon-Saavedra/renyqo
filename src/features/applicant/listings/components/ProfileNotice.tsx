"use client";

import Link from "next/link";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { applicantProfileCopy } from "../../profile/copy/applicant-profile";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { buildProfileHref } from "../../profile/utils/profile-href";
import { listingsCopy } from "../copy/listings";

interface ProfileNoticeProps {
  returnTo: string;
}

const WRAPPER_CLASS =
  "mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-primary-tint px-4.5 py-3.5";

const TEXT_CLASS = "text-caption text-foreground";

export function ProfileNotice({ returnTo }: ProfileNoticeProps) {
  const status = useApplicantProfileStatus();

  if (status !== "missing") return null;

  return (
    <div className={WRAPPER_CLASS}>
      <span className={TEXT_CLASS}>
        {listingsCopy.profileNotice.lead}
        <strong className="font-medium">
          {listingsCopy.profileNotice.leadStrong}
        </strong>
        {listingsCopy.profileNotice.leadTail}
      </span>
      <Link
        href={buildProfileHref(returnTo)}
        className={buttonClassWithSize("primary", "sm", "shrink-0")}
      >
        {applicantProfileCopy.cta.create}
      </Link>
    </div>
  );
}
