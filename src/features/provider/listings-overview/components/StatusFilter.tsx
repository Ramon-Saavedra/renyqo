import { cn } from "@/lib/utils/cn";
import { listingsCopy, STATUS_FILTERS } from "../copy/listings";
import type { StatusCounts, StatusFilterKey } from "../types";

interface StatusFilterProps {
  value: StatusFilterKey;
  onChange: (value: StatusFilterKey) => void;
  counts: StatusCounts;
  className?: string;
}

const WRAPPER_CLASS = "flex flex-wrap items-center gap-2";
const GROUP_CLASS =
  "flex flex-wrap items-center gap-1 rounded-md border border-border/50 bg-background-subtle p-1";

const BUTTON_BASE =
  "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border border-transparent bg-transparent px-2.5 font-mono text-meta uppercase text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus whitespace-nowrap";
const BUTTON_ACTIVE =
  "border-border/50 bg-background-subtle text-foreground hover:text-foreground";

const COUNT_BASE = "font-mono text-meta text-foreground-tertiary";
const COUNT_ACTIVE = "text-foreground-secondary";

const DIVIDER_CLASS = "h-4 w-px bg-border/40 shrink-0";

const ATTENTION_BASE =
  "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm border border-transparent bg-transparent px-2.5 font-mono text-meta uppercase text-foreground-tertiary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus whitespace-nowrap";
const ATTENTION_ACTIVE =
  "border-border/50 bg-background-subtle text-foreground-secondary hover:text-foreground";

const STATUS_FILTER_ITEMS = STATUS_FILTERS.filter((f) => f.id !== "attention");
const ATTENTION_FILTER = STATUS_FILTERS.find((f) => f.id === "attention");

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
        {STATUS_FILTER_ITEMS.map((item) => {
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

      {ATTENTION_FILTER && (
        <>
          <span aria-hidden="true" className={DIVIDER_CLASS} />
          <button
            type="button"
            role="radio"
            aria-checked={value === ATTENTION_FILTER.id}
            data-active={value === ATTENTION_FILTER.id}
            onClick={() => onChange(ATTENTION_FILTER.id)}
            className={cn(
              ATTENTION_BASE,
              value === ATTENTION_FILTER.id && ATTENTION_ACTIVE,
            )}
          >
            {ATTENTION_FILTER.label}
            <span
              className={cn(
                COUNT_BASE,
                value === ATTENTION_FILTER.id && COUNT_ACTIVE,
              )}
            >
              {counts[ATTENTION_FILTER.id]}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
