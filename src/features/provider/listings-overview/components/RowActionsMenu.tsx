"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";
import type { ListingOverviewItem, RowAction } from "../types";

interface RowActionsMenuProps {
  listing: ListingOverviewItem;
  onAction: (action: RowAction, listing: ListingOverviewItem) => void;
  disabled?: boolean;
}

const TRIGGER_CLASS =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-foreground-secondary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const MENU_CLASS =
  "absolute right-0 top-[calc(100%+0.375rem)] z-30 min-w-56 rounded-md border border-border bg-background-subtle p-1 shadow-card";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2 text-left text-caption text-foreground transition-colors hover:bg-background-subtle";

const ICON_CLASS = "text-foreground-tertiary";

export function RowActionsMenu({
  listing,
  onAction,
  disabled = false,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.stopPropagation();
        }
      }}
    >
      <button
        type="button"
        className={TRIGGER_CLASS}
        aria-label={listingsCopy.row.moreLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <AppIcon icon={MoreHorizontal} size={16} strokeWidth={1.8} decorative />
      </button>
      {open && (
        <div id={menuId} role="menu" className={MENU_CLASS}>
          <button
            type="button"
            role="menuitem"
            className={ITEM_CLASS}
            onClick={() => {
              setOpen(false);
              onAction("details", listing);
            }}
          >
            <AppIcon
              icon={Eye}
              size={14}
              strokeWidth={1.6}
              decorative
              className={ICON_CLASS}
            />
            {listingsCopy.actions.details}
          </button>
        </div>
      )}
    </div>
  );
}
