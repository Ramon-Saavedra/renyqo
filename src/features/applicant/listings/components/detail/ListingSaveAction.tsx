"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button, buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../../copy/listing-detail";
import { useListingSave } from "../../hooks/useListingSave";
import type { ListingViewerSessionStatus } from "../../hooks/useListingViewerSession";
import { LISTING_LOGIN_PATH } from "../../utils/listing-auth-paths";

interface ListingSaveActionProps {
  listingId: string;
  isSaved: boolean;
  session: ListingViewerSessionStatus;
}

const WRAPPER_CLASS = "w-fit max-w-full";

const { save } = listingDetailCopy;

export function ListingSaveAction({
  listingId,
  isSaved,
  session,
}: ListingSaveActionProps) {
  const { saved, status, error, toggle } = useListingSave(listingId, isSaved);
  const submitting = status === "submitting";
  const label = saved ? save.savedLabel : save.label;

  if (session === "other" || session === "error") {
    return null;
  }

  if (session === "anonymous") {
    return (
      <div className={WRAPPER_CLASS}>
        <Link
          href={LISTING_LOGIN_PATH}
          className={buttonClassWithSize("primaryGhost", "sm")}
        >
          <AppIcon icon={Heart} size={14} strokeWidth={1.8} decorative />
          {save.label}
        </Link>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      <Button
        variant="primaryGhost"
        size="sm"
        aria-pressed={saved}
        disabled={submitting || session === "loading"}
        onClick={() => {
          if (session !== "applicant") return;
          void toggle();
        }}
      >
        <AppIcon
          icon={Heart}
          size={14}
          strokeWidth={1.8}
          decorative
          className={cn(saved && "fill-current")}
        />
        {label}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
