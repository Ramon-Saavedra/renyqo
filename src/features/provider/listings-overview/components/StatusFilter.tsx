import { cn } from "@/lib/utils/cn";
import { listingsCopy, STATUS_FILTERS } from "../copy/listings";
import type { StatusCounts, StatusFilterKey } from "../types";

interface StatusFilterProps {
  value: StatusFilterKey;
  onChange: (value: StatusFilterKey) => void;
  counts: StatusCounts;
  className?: string;
}

const WRAPPER_CLASS = "flex";
const GROUP_CLASS =
  "flex flex-wrap items-center gap-1 rounded-md border border-border bg-background-subtle p-1";

const BUTTON_BASE =
  "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border border-transparent bg-transparent px-2.5 font-mono text-meta uppercase text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus whitespace-nowrap";
const BUTTON_ACTIVE =
  "border-border bg-card text-foreground hover:text-foreground";

const COUNT_BASE = "font-mono text-meta text-foreground-tertiary";
const COUNT_ACTIVE = "text-foreground-secondary";

export function StatusFilter({
  value,
  onChange,
  counts,
  className,
}: StatusFilterProps) {
  return (
    <div className={cn(WRAPPER_CLASS, className)}>
      <div
        className={GROUP_CLASS}
        role="radiogroup"
        aria-label={listingsCopy.filter.ariaLabel}
      >
        {STATUS_FILTERS.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              data-active={active}
              onClick={() => onChange(item.id)}
              className={cn(BUTTON_BASE, active && BUTTON_ACTIVE)}
            >
              {item.label}
              <span className={cn(COUNT_BASE, active && COUNT_ACTIVE)}>
                {counts[item.id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
