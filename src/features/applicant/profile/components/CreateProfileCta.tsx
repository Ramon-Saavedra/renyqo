"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button/Button";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { applicantProfileCopy } from "../copy/applicant-profile";
import { useApplicantProfileStatus } from "../hooks/useApplicantProfileStatus";
import { buildProfileHref } from "../utils/profile-href";

interface CreateProfileCtaProps {
  returnTo: string;
}

export function CreateProfileCta({ returnTo }: CreateProfileCtaProps) {
  const status = useApplicantProfileStatus();

  if (status === "loading") {
    return <RenyqoSkeleton variant="pill" width={196} height={44} />;
  }

  if (status !== "missing") return null;

  return (
    <Link href={buildProfileHref(returnTo)} className={buttonClass("primary")}>
      {applicantProfileCopy.cta.create}
    </Link>
  );
}
