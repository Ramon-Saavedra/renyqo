import {
  COMPOUND_BUTTON_FOCUS_CLASS,
  COMPOUND_SELECTED_FOCUS_CLASS,
} from "./control-styles";
import { type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel?: string;
  id?: string;
  saved?: boolean;
}

const GROUP_CLASS =
  "inline-flex h-11 w-full gap-0.5 rounded-md border border-border-strong bg-input p-0.75";
const SEG_CLASS =
  "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent px-2.5 text-action ";
const SEG_ON_CLASS =
  "border-transparent bg-primary-default font-medium text-primary-foreground underline decoration-2 decoration-primary-foreground underline-offset-4 ";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  saved = false,
}: SegmentedProps<T>) {
  return (
    <div
      id={id}
      className={cn(GROUP_CLASS, saved && SAVED_FIELD_CLASS)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              SEG_CLASS,
              active
                ? COMPOUND_SELECTED_FOCUS_CLASS
                : COMPOUND_BUTTON_FOCUS_CLASS,
              active ? SEG_ON_CLASS : "bg-transparent",
            )}
          >
            {o.icon && (
              <AppIcon icon={o.icon} size={14} strokeWidth={1.4} decorative />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
