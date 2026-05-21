import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { createListingCopy } from "../copy/create-listing";
import type { AutoSaveStatus } from "../hooks/useAutoSaveIndicator";

interface TopbarActionsProps {
  status: AutoSaveStatus;
}

export function TopbarActions({ status }: TopbarActionsProps) {
  const isSaving = status === "saving";
  const pipClass = isSaving
    ? "h-1.5 w-1.5 animate-pulse rounded-full bg-warning"
    : "h-1.5 w-1.5 rounded-full bg-success";
  const label = isSaving
    ? createListingCopy.topbar.saving
    : createListingCopy.topbar.autoSaved;

  return (
    <>
      <span className="rounded-sm bg-background-muted px-2.25 py-1.25 font-mono text-meta uppercase text-foreground-secondary">
        {createListingCopy.topbar.draft}
      </span>
      <span
        className="flex items-center gap-1.75 font-mono text-meta uppercase text-foreground-tertiary"
        aria-live="polite"
      >
        <span aria-hidden="true" className={pipClass} />
        {label}
      </span>
      <Link
        href={createListingCopy.topbar.backHref}
        className={buttonClass("ghost")}
      >
        <AppIcon icon={ArrowLeft} size={14} strokeWidth={1.6} decorative />
        {createListingCopy.topbar.back}
      </Link>
    </>
  );
}
