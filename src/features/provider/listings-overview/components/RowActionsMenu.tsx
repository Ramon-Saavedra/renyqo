"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pause,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";
import type { ListingOverviewItem, RowAction } from "../types";

interface RowActionsMenuProps {
  listing: ListingOverviewItem;
  onAction: (action: RowAction, listing: ListingOverviewItem) => void;
}

interface MenuItem {
  readonly id: RowAction;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly visible: boolean;
  readonly tone?: "danger";
}

const TRIGGER_CLASS =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-foreground-secondary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const MENU_CLASS =
  "absolute right-0 top-[calc(100%+0.375rem)] z-30 min-w-56 rounded-md border border-border bg-card p-1 shadow-card";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2 text-left text-caption text-foreground transition-colors hover:bg-background-subtle";

const ITEM_DANGER_CLASS = "text-foreground-secondary hover:text-foreground";

const ICON_CLASS = "text-foreground-tertiary";

function buildItems(status: ListingOverviewItem["status"]): MenuItem[] {
  return [
    {
      id: "preview",
      label: listingsCopy.actions.preview,
      icon: Eye,
      visible: true,
    },
    {
      id: "edit",
      label: listingsCopy.actions.edit,
      icon: SquarePen,
      visible: status !== "archived",
    },
    {
      id: "pause",
      label: listingsCopy.actions.pause,
      icon: Pause,
      visible: status === "published",
    },
    {
      id: "rented",
      label: listingsCopy.actions.rented,
      icon: CheckCircle2,
      visible: status === "published" || status === "paused",
    },
    {
      id: "archive",
      label: listingsCopy.actions.archive,
      icon: Archive,
      visible: status !== "archived",
      tone: "danger",
    },
  ];
}

export function RowActionsMenu({ listing, onAction }: RowActionsMenuProps) {
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

  const items = buildItems(listing.status).filter((it) => it.visible);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={TRIGGER_CLASS}
        aria-label={listingsCopy.row.moreLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <AppIcon icon={MoreHorizontal} size={16} strokeWidth={1.8} decorative />
      </button>
      {open && (
        <div id={menuId} role="menu" className={MENU_CLASS}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              className={cn(
                ITEM_CLASS,
                it.tone === "danger" && ITEM_DANGER_CLASS,
              )}
              onClick={() => {
                setOpen(false);
                onAction(it.id, listing);
              }}
            >
              <AppIcon
                icon={it.icon}
                size={14}
                strokeWidth={1.6}
                decorative
                className={ICON_CLASS}
              />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
