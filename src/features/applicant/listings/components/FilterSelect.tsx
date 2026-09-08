"use client";

import { useId, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { cn } from "@/lib/utils/cn";
import {
  useFilterCustomValue,
  type FilterCustomCommitResult,
} from "../hooks/useFilterCustomValue";
import { filterChipClass } from "./filter-chip";
import { FilterCustomValueInput } from "./FilterCustomValueInput";

export interface FilterSelectOption {
  readonly value: number | null;
  readonly label: string;
}

interface FilterSelectCustom {
  readonly optionLabel: string;
  readonly suffix: string;
  readonly inputAriaLabel: string;
  readonly formatValue: (value: number) => string;
}

interface FilterSelectProps {
  label: string;
  value: number | null;
  options: readonly FilterSelectOption[];
  onChange: (value: number | null) => void;
  className?: string;
  custom?: FilterSelectCustom;
}

const PANEL_CLASS = "min-w-56 p-1";

const OPTION_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-caption text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:shadow-focus";

const OPTION_ACTIVE_CLASS =
  "bg-primary-tint text-primary hover:bg-primary-tint";

const CUSTOM_FIELD_CLASS = "px-2 pb-2 pt-1";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
  custom,
}: FilterSelectProps) {
  const customInputId = useId();
  const customValue = useFilterCustomValue(value, options, onChange);
  const presetRefs = useRef(new Map<number | null, HTMLButtonElement>());
  const customRadioRef = useRef<HTMLButtonElement | null>(null);
  const selected = options.find((option) => option.value === value);

  const commitCustomValue = (source: "enter" | "blur"): boolean => {
    const result: FilterCustomCommitResult = customValue.commit();
    if (result.kind === "kept") return false;
    if (source !== "enter") return true;
    const target =
      result.kind === "preset"
        ? presetRefs.current.get(result.value)
        : customRadioRef.current;
    requestAnimationFrame(() => {
      target?.focus();
    });
    return true;
  };

  const triggerLabel =
    value === null
      ? label
      : custom
        ? `${label} ${custom.formatValue(value)}`
        : selected
          ? `${label} ${selected.label}`
          : label;

  return (
    <PopoverPanel
      ariaLabel={triggerLabel}
      align="left"
      className={className}
      panelClassName={PANEL_CLASS}
      onClose={() => {
        if (customValue.customMode) customValue.commit();
      }}
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          className={filterChipClass(value !== null)}
        >
          {triggerLabel}
          <AppIcon icon={ChevronDown} size={13} strokeWidth={1.6} decorative />
        </button>
      )}
    >
      <div role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isActive = !customValue.customMode && option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={cn(OPTION_CLASS, isActive && OPTION_ACTIVE_CLASS)}
              ref={(node) => {
                if (node) presetRefs.current.set(option.value, node);
                else presetRefs.current.delete(option.value);
              }}
              onClick={() => customValue.selectPreset(option.value)}
            >
              <span>{option.label}</span>
              {isActive && (
                <AppIcon icon={Check} size={13} strokeWidth={1.8} decorative />
              )}
            </button>
          );
        })}
        {custom && (
          <button
            type="button"
            role="radio"
            aria-checked={customValue.customMode}
            className={cn(
              OPTION_CLASS,
              customValue.customMode && OPTION_ACTIVE_CLASS,
            )}
            ref={customRadioRef}
            onClick={customValue.selectCustom}
          >
            <span>{custom.optionLabel}</span>
            {customValue.customMode && (
              <AppIcon icon={Check} size={13} strokeWidth={1.8} decorative />
            )}
          </button>
        )}
      </div>
      {custom && customValue.customMode && (
        <div className={CUSTOM_FIELD_CLASS}>
          <FilterCustomValueInput
            id={customInputId}
            value={customValue.draft}
            suffix={custom.suffix}
            ariaLabel={custom.inputAriaLabel}
            onChange={customValue.setDraft}
            onCommit={commitCustomValue}
          />
        </div>
      )}
    </PopoverPanel>
  );
}
