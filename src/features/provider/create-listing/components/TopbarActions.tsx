import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleX,
  EyeOff,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
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

const STATUS_TEXT_CLASS: Record<Exclude<ListingSaveStatus, "idle">, string> = {
  dirty: "text-warning",
  saved: "text-success",
  error: "text-danger",
};

const STATUS_ICON: Record<Exclude<ListingSaveStatus, "idle">, LucideIcon> = {
  dirty: AlertCircle,
  saved: CheckCircle2,
  error: CircleX,
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
      <span
        className="inline-flex h-5 items-center gap-1 rounded-sm bg-background-muted px-1 py-0.5 text-meta font-normal normal-case tracking-normal text-foreground-secondary sm:px-1.5"
        title={createListingCopy.topbar.draft}
      >
        <AppIcon icon={EyeOff} size={12} strokeWidth={1.8} decorative />
        <span className="sr-only lg:not-sr-only">
          {createListingCopy.topbar.draft}
        </span>
      </span>
      {status !== "idle" && (
        <span
          className={`inline-flex h-5 items-center gap-1 rounded-sm px-1 text-meta font-normal normal-case tracking-normal ${STATUS_TEXT_CLASS[status]}`}
          aria-live="polite"
          title={STATUS_LABEL[status]}
        >
          <AppIcon
            icon={STATUS_ICON[status]}
            size={12}
            strokeWidth={1.8}
            decorative
          />
          <span className="sr-only lg:not-sr-only">
            {STATUS_LABEL[status]}
          </span>
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
          <span className="sr-only lg:not-sr-only">
            {createListingCopy.topbar.undo}
          </span>
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
          <span className="sr-only lg:not-sr-only">
            {createListingCopy.topbar.redo}
          </span>
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
