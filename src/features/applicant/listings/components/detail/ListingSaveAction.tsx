"use client";

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../../copy/listing-detail";
import { useListingSave } from "../../hooks/useListingSave";

interface ListingSaveActionProps {
  listingId: string;
  isSaved: boolean;
}

const WRAPPER_CLASS = "w-fit max-w-full";

const { save } = listingDetailCopy;

export function ListingSaveAction({
  listingId,
  isSaved,
}: ListingSaveActionProps) {
  const { saved, status, error, toggle } = useListingSave(listingId, isSaved);
  const submitting = status === "submitting";
  const label = saved ? save.savedLabel : save.label;

  return (
    <div className={WRAPPER_CLASS}>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={saved}
        disabled={submitting}
        onClick={() => void toggle()}
      >
        <AppIcon
          icon={Bookmark}
          size={14}
          strokeWidth={1.8}
          decorative
          {...(saved ? { className: "fill-current" } : {})}
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
