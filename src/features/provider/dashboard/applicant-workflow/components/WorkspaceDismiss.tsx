"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import type { RefObject } from "react";
import {
  buttonClass,
  buttonClassWithSize,
} from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "@/features/provider/listings-overview/copy/listings";
import { applicantWorkflowCopy } from "../copy";

export function WorkspaceDismiss({
  compact,
  returnHref,
  onClose,
  closeButtonRef,
}: {
  readonly compact: boolean;
  readonly returnHref?: string;
  readonly onClose: () => void;
  readonly closeButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const className = buttonClassWithSize(
    "ghost",
    compact ? "icon-md" : "icon-sm",
  );
  const icon = (
    <AppIcon icon={X} size={compact ? 20 : 16} strokeWidth={2} decorative />
  );
  if (returnHref) {
    return (
      <Link href={returnHref} className={buttonClass("ghost", "w-fit")}>
        <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
        {listingsCopy.topbar.back}
      </Link>
    );
  }
  return (
    <button
      ref={closeButtonRef}
      type="button"
      onClick={onClose}
      aria-label={applicantWorkflowCopy.close}
      className={className}
    >
      {icon}
    </button>
  );
}
