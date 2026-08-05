"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { listingsCopy } from "../copy/listings";
import { formatAvailability } from "../utils/format";
import { filterChipClass } from "./filter-chip";

interface AvailabilityFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

const PANEL_CLASS = "w-64 p-3.5";

const LABEL_CLASS =
  "mb-2 block font-mono text-meta uppercase text-foreground-tertiary";

export function AvailabilityFilter({
  value,
  onChange,
  className,
}: AvailabilityFilterProps) {
  const fieldId = useId();
  const active = value !== null;

  return (
    <PopoverPanel
      ariaLabel={listingsCopy.filters.availableFrom}
      align="left"
      className={className}
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          className={filterChipClass(active)}
        >
          {active
            ? `${listingsCopy.filters.availableFrom} ${formatAvailability(value)}`
            : listingsCopy.filters.availableFrom}
          <AppIcon icon={ChevronDown} size={13} strokeWidth={1.6} decorative />
        </button>
      )}
    >
      <label className={LABEL_CLASS} htmlFor={fieldId}>
        {listingsCopy.filters.availableFromLabel}
      </label>
      <Input
        id={fieldId}
        type="date"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      />
      {active && (
        <button
          type="button"
          className={buttonClassWithSize(
            "ghost",
            "sm",
            "mt-3 w-full justify-center",
          )}
          onClick={() => onChange(null)}
        >
          {listingsCopy.filters.reset}
        </button>
      )}
    </PopoverPanel>
  );
}
