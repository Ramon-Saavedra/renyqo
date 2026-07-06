import { type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

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
}

const GROUP_CLASS =
  "inline-flex h-11 w-full gap-0.5 rounded-md border border-border-strong bg-background-subtle p-0.75";
const SEG_CLASS =
  "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent bg-transparent px-2.5 text-action ";
const SEG_ON_CLASS =
  "border-transparent bg-primary font-medium text-primary underline decoration-2 decoration-primary underline-offset-4 ";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className={GROUP_CLASS} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={active ? `${SEG_CLASS} ${SEG_ON_CLASS}` : SEG_CLASS}
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
