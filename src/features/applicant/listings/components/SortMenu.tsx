"use client";

import { Check, ChevronDown } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { cn } from "@/lib/utils/cn";
import { listingsCopy, SORT_OPTIONS } from "../copy/listings";
import type { SortKey } from "../types";

interface SortMenuProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

const TRIGGER_CLASS =
  "inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-md border border-border-strong bg-input px-3 text-caption text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:shadow-focus";

const TRIGGER_LABEL_CLASS = "hidden text-foreground-tertiary sm:inline";

const TRIGGER_VALUE_CLASS = "font-medium text-foreground";

const PANEL_CLASS = "min-w-52 p-1";

const OPTION_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-caption text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:shadow-focus";

const OPTION_ACTIVE_CLASS =
  "bg-primary-tint text-primary hover:bg-primary-tint";

export function SortMenu({ value, onChange }: SortMenuProps) {
  const current = SORT_OPTIONS.find((option) => option.id === value);

  return (
    <PopoverPanel
      ariaLabel={listingsCopy.results.sortMenuAriaLabel}
      align="right"
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button {...triggerProps} ref={triggerRef} className={TRIGGER_CLASS}>
          <span className={TRIGGER_LABEL_CLASS}>
            {listingsCopy.results.sortTriggerLabel}
          </span>
          <span className={TRIGGER_VALUE_CLASS}>{current?.label ?? ""}</span>
          <AppIcon icon={ChevronDown} size={13} strokeWidth={1.6} decorative />
        </button>
      )}
    >
      <div
        role="radiogroup"
        aria-label={listingsCopy.results.sortMenuAriaLabel}
      >
        {SORT_OPTIONS.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn(OPTION_CLASS, active && OPTION_ACTIVE_CLASS)}
              onClick={() => onChange(option.id)}
            >
              <span>{option.label}</span>
              {active && (
                <AppIcon icon={Check} size={13} strokeWidth={1.8} decorative />
              )}
            </button>
          );
        })}
      </div>
    </PopoverPanel>
  );
}
