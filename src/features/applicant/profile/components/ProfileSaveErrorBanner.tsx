"use client";

import { AlertTriangle } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicantProfileCopy } from "../copy/applicant-profile";

interface ProfileSaveErrorBannerProps {
  onRetry: () => void;
}

const BANNER_CLASS =
  "mb-4.5 flex items-start gap-3 rounded-md border border-warning/20 bg-warning/10 px-4 py-3.5 text-caption leading-normal text-foreground-secondary";

export function ProfileSaveErrorBanner({
  onRetry,
}: ProfileSaveErrorBannerProps) {
  const copy = applicantProfileCopy.saveError;

  return (
    <div role="alert" className={BANNER_CLASS}>
      <span className="shrink-0 pt-0.5 text-warning">
        <AppIcon icon={AlertTriangle} size={16} strokeWidth={1.3} decorative />
      </span>
      <div className="flex flex-col items-start gap-2">
        <strong className="font-semibold text-foreground">{copy.title}</strong>
        <span>{copy.text}</span>
        <button
          type="button"
          className={buttonClassWithSize("outline", "sm")}
          onClick={onRetry}
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
