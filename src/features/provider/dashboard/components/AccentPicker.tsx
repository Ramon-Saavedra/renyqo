"use client";

import { Blend } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { ACCENTS, dashboardCopy } from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";
import { cn } from "@/lib/utils/cn";

interface AccentPickerProps {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

const TRIGGER_CLASS =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:shadow-focus";
const PANEL_CLASS = "w-32 p-3";
const SWATCHES_CLASS = "grid grid-cols-3 gap-2";
const SWATCH_BASE =
  "h-5 w-5 cursor-pointer rounded bg-primary hover:scale-110 focus-visible:outline-none focus-visible:shadow-focus";
const SWATCH_ACTIVE =
  "scale-110 ring-1 ring-foreground ring-offset-2 ring-offset-background";

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const { accent } = dashboardCopy;

  return (
    <PopoverPanel
      ariaLabel={accent.label}
      align="right"
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button {...triggerProps} ref={triggerRef} className={TRIGGER_CLASS}>
          <AppIcon icon={Blend} size={16} strokeWidth={1.8} decorative />
        </button>
      )}
    >
      <div
        role="radiogroup"
        aria-label={accent.ariaLabel}
        className={SWATCHES_CLASS}
      >
        {ACCENTS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === value}
            aria-label={option.label}
            title={option.label}
            data-accent={option.id}
            onClick={() => onChange(option.id)}
            className={cn(SWATCH_BASE, option.id === value && SWATCH_ACTIVE)}
          />
        ))}
      </div>
    </PopoverPanel>
  );
}
