"use client";

import { Check, ChevronDown } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { cn } from "@/lib/utils/cn";
import { filterChipClass } from "./filter-chip";

export interface FilterSelectOption {
  readonly value: number | null;
  readonly label: string;
}

interface FilterSelectProps {
  label: string;
  value: number | null;
  options: readonly FilterSelectOption[];
  onChange: (value: number | null) => void;
  className?: string;
}

const PANEL_CLASS = "min-w-48 p-1";

const OPTION_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-caption text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:shadow-focus";

const OPTION_ACTIVE_CLASS =
  "bg-primary-tint text-primary hover:bg-primary-tint";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  const active = value !== null;
  const selected = options.find((option) => option.value === value);

  return (
    <PopoverPanel
      ariaLabel={label}
      align="left"
      className={className}
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          className={filterChipClass(active)}
        >
          {active && selected ? selected.label : label}
          <AppIcon icon={ChevronDown} size={13} strokeWidth={1.6} decorative />
        </button>
      )}
    >
      <div role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={cn(OPTION_CLASS, isActive && OPTION_ACTIVE_CLASS)}
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              {isActive && (
                <AppIcon icon={Check} size={13} strokeWidth={1.8} decorative />
              )}
            </button>
          );
        })}
      </div>
    </PopoverPanel>
  );
}
