"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../copy/listing-detail";
import { useListingSave } from "../hooks/useListingSave";
import type { ListingViewerSessionStatus } from "../hooks/useListingViewerSession";
import { LISTING_LOGIN_PATH } from "../utils/listing-auth-paths";

interface ListingCardSaveButtonProps {
  listingId: string;
  isSaved: boolean;
  session: ListingViewerSessionStatus;
  onSavedChange?: (saved: boolean) => void;
}

const WRAPPER_CLASS =
  "pointer-events-none absolute inset-x-2 top-2 z-10 flex flex-col items-end";

const ERROR_CLASS =
  "pointer-events-auto mt-1 max-w-full text-right text-caption break-words text-danger";

const SAVE_BUTTON_CLASS =
  "pointer-events-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm bg-background p-0 text-primary shadow-card hover:text-primary-hover hover:shadow-card-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

const { save } = listingDetailCopy;

export function ListingCardSaveButton({
  listingId,
  isSaved,
  session,
  onSavedChange,
}: ListingCardSaveButtonProps) {
  const { saved, status, error, toggle } = useListingSave(
    listingId,
    isSaved,
    onSavedChange,
  );
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
          className={SAVE_BUTTON_CLASS}
          aria-label={save.label}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AppIcon icon={Heart} size={14} strokeWidth={1.8} decorative />
        </Link>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      <button
        type="button"
        className={SAVE_BUTTON_CLASS}
        aria-pressed={saved}
        aria-label={label}
        disabled={submitting || session === "loading"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (session !== "applicant") return;
          void toggle();
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <AppIcon
          icon={Heart}
          size={14}
          strokeWidth={1.8}
          decorative
          className={cn(saved && "fill-current")}
        />
      </button>
      {error ? (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
