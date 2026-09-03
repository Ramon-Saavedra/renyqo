import { cn } from "@/lib/utils/cn";
import { ACCENTS } from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";

interface AccentSwatchesProps {
  value: AccentId;
  ariaLabel: string;
  onChange: (accent: AccentId) => void;
}

const GRID_CLASS = "grid grid-cols-3 justify-items-center gap-2";
const OPTION_CLASS =
  "group flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-none focus-visible:shadow-focus";
const SWATCH_CLASS =
  "h-4 w-4 rounded-sm bg-primary transition-transform group-hover:scale-110";
const SWATCH_ACTIVE_CLASS =
  "scale-110 ring-1 ring-foreground ring-offset-2 ring-offset-background";

export function AccentSwatches({
  value,
  ariaLabel,
  onChange,
}: AccentSwatchesProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={GRID_CLASS}>
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
          className={OPTION_CLASS}
        >
          <span
            aria-hidden="true"
            className={cn(
              SWATCH_CLASS,
              option.id === value && SWATCH_ACTIVE_CLASS,
            )}
          />
        </button>
      ))}
    </div>
  );
}
