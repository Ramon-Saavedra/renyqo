"use client";

import { ACCENTS, dashboardCopy } from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";
import { cn } from "@/lib/utils/cn";

interface AccentPickerProps {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

const WRAP_CLASS =
  "inline-flex shrink-0 items-center gap-2.5 rounded-full bg-background px-2.5 py-1.5";
const LABEL_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";
const SWATCHES_CLASS = "flex flex-wrap items-center gap-1.5";
const SWATCH_BASE =
  "h-3.5 w-3.5 cursor-pointer rounded-full bg-primary transition-transform hover:scale-115 focus-visible:outline-none focus-visible:shadow-focus";
const SWATCH_ACTIVE =
  "scale-110 ring-1 ring-foreground ring-offset-2 ring-offset-background";

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const { accent } = dashboardCopy;

  return (
    <div className={WRAP_CLASS}>
      <span className={LABEL_CLASS}>{accent.label}</span>
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
    </div>
  );
}
