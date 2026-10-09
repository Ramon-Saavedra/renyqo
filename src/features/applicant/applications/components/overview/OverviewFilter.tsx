import { cn } from "@/lib/utils/cn";
import { applicationsCopy } from "../../copy";
import type { OverviewGroup } from "../../model/status";

export type OverviewFilterValue = "ALL" | OverviewGroup;

export interface OverviewFilterOption {
  readonly value: OverviewFilterValue;
  readonly count: number | null;
}

interface OverviewFilterProps {
  readonly value: OverviewFilterValue;
  readonly options: readonly OverviewFilterOption[];
  readonly onChange: (value: OverviewFilterValue) => void;
}

export function OverviewFilter({
  value,
  options,
  onChange,
}: OverviewFilterProps) {
  return (
    <div
      role="group"
      aria-label={applicationsCopy.overview.filterLabel}
      className="flex w-fit max-w-full flex-wrap gap-1 rounded-md border border-border bg-background-subtle p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm border px-3 text-action font-medium focus-visible:outline-none focus-visible:shadow-focus",
              selected
                ? "border-border bg-background-muted text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground",
            )}
          >
            {applicationsCopy.overview.filters[option.value]}
            {option.count === null ? null : (
              <>
                {" "}
                <span className="text-caption font-normal text-foreground-tertiary">
                  {option.count}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
