"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingsCopy, SORT_OPTIONS } from "../copy/listings";
import type { SortKey } from "../types";

interface SortMenuProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

const TRIGGER_CLASS =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-strong bg-transparent px-2.5 text-caption text-foreground transition-colors hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus";

const TRIGGER_LABEL_CLASS = "text-foreground-tertiary text-caption";
const TRIGGER_VALUE_CLASS = "font-medium text-foreground";

const MENU_CLASS =
  "absolute right-0 top-[calc(100%+0.375rem)] z-30 min-w-56 rounded-md border border-border bg-background-subtle p-1 shadow-card";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-caption text-foreground transition-colors hover:bg-background-subtle";
const ITEM_ACTIVE = "bg-primary-tint text-primary hover:bg-primary-tint";

export function SortMenu({ value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const current = SORT_OPTIONS.find((o) => o.id === value);

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
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={TRIGGER_CLASS}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <AppIcon
          icon={SlidersHorizontal}
          size={13}
          strokeWidth={1.6}
          decorative
        />
        <span className={TRIGGER_LABEL_CLASS}>
          {listingsCopy.sort.triggerLabel}
        </span>
        <span className={TRIGGER_VALUE_CLASS}>{current?.label ?? ""}</span>
        <AppIcon icon={ChevronDown} size={12} strokeWidth={1.6} decorative />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={listingsCopy.sort.menuAriaLabel}
          className={MENU_CLASS}
        >
          {SORT_OPTIONS.map((opt) => {
            const active = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(ITEM_CLASS, active && ITEM_ACTIVE)}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {active && (
                  <AppIcon
                    icon={Check}
                    size={13}
                    strokeWidth={1.8}
                    decorative
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
