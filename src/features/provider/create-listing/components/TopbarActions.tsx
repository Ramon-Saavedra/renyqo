import Link from "next/link";
import { ArrowLeft, Redo2, Undo2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { createListingCopy } from "../copy/create-listing";

export type ListingSaveStatus = "idle" | "dirty" | "saved" | "error";

interface TopbarActionsProps {
  status: ListingSaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const STATUS_PIP_CLASS: Record<Exclude<ListingSaveStatus, "idle">, string> = {
  dirty: "h-1.5 w-1.5 rounded-full bg-warning",
  saved: "h-1.5 w-1.5 rounded-full bg-success",
  error: "h-1.5 w-1.5 rounded-full bg-danger",
};

const STATUS_TEXT_CLASS: Record<Exclude<ListingSaveStatus, "idle">, string> = {
  dirty: "text-warning",
  saved: "text-success",
  error: "text-danger",
};

const STATUS_LABEL: Record<Exclude<ListingSaveStatus, "idle">, string> = {
  dirty: createListingCopy.topbar.unsavedChanges,
  saved: createListingCopy.topbar.saved,
  error: createListingCopy.topbar.saveError,
};

export function TopbarActions({
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: TopbarActionsProps) {
  return (
    <>
      <span className="rounded-sm bg-background-muted px-2.25 py-1.25 font-mono text-meta uppercase text-foreground-secondary">
        {createListingCopy.topbar.draft}
      </span>
      {status !== "idle" && (
        <span
          className={`flex items-center gap-1.75 font-mono text-meta uppercase ${STATUS_TEXT_CLASS[status]}`}
          aria-live="polite"
        >
          <span aria-hidden="true" className={STATUS_PIP_CLASS[status]} />
          {STATUS_LABEL[status]}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={buttonClass("ghost")}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <AppIcon
            icon={Undo2}
            size={14}
            strokeWidth={1.6}
            decorative
            disabled={!canUndo}
          />
          {createListingCopy.topbar.undo}
        </button>
        <button
          type="button"
          className={buttonClass("ghost")}
          disabled={!canRedo}
          onClick={onRedo}
        >
          <AppIcon
            icon={Redo2}
            size={14}
            strokeWidth={1.6}
            decorative
            disabled={!canRedo}
          />
          {createListingCopy.topbar.redo}
        </button>
      </div>
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
