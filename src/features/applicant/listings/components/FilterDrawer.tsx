"use client";

import { useId, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  buttonClassWithSize,
  buttonClass,
} from "@/components/ui/button/Button";
import { Input } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  AREA_OPTIONS,
  COLD_RENT_OPTIONS,
  listingsCopy,
  ROOM_OPTIONS,
} from "../copy/listings";
import {
  useFilterCustomValue,
  type FilterCustomCommitResult,
} from "../hooks/useFilterCustomValue";
import type { ListingFilters } from "../types";
import { filterChipClass } from "./filter-chip";
import { FilterCustomValueInput } from "./FilterCustomValueInput";

interface FilterDrawerProps {
  open: boolean;
  filters: ListingFilters;
  resultCount: number;
  onChange: (patch: Partial<ListingFilters>) => void;
  onReset: () => void;
  onClose: () => void;
}

const SCRIM_CLASS = "fixed inset-0 z-40 bg-foreground/40 xl:hidden";

const SHEET_CLASS =
  "fixed inset-x-0 bottom-0 z-50 max-h-dvh overflow-y-auto rounded-t-md border-t border-border bg-background-muted px-4.5 pt-4 pb-6 shadow-card scrollbar-slim xl:hidden";

const HANDLE_CLASS = "mx-auto mb-4 h-1 w-9 rounded-full bg-border-strong";

const HEAD_CLASS = "mb-4 flex items-center justify-between";

const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";

const GROUP_CLASS = "mb-4.5";

const GROUP_LABEL_CLASS =
  "mb-2.5 font-mono text-meta uppercase text-foreground-tertiary";

const CHIP_ROW_CLASS = "flex flex-wrap gap-2";

const CUSTOM_FIELD_CLASS = "mt-2.5";

const CLOSE_CLASS =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function FilterDrawer({
  open,
  filters,
  resultCount,
  onChange,
  onReset,
  onClose,
}: FilterDrawerProps) {
  const titleId = useId();
  const dateId = useId();
  const rentInputId = useId();
  const areaInputId = useId();

  const rentCustom = useFilterCustomValue(
    filters.maxColdRent,
    COLD_RENT_OPTIONS,
    (maxColdRent) => onChange({ maxColdRent }),
  );
  const areaCustom = useFilterCustomValue(
    filters.minLivingArea,
    AREA_OPTIONS,
    (minLivingArea) => onChange({ minLivingArea }),
  );
  const rentPresetRefs = useRef(new Map<number | null, HTMLButtonElement>());
  const rentCustomRef = useRef<HTMLButtonElement | null>(null);
  const areaPresetRefs = useRef(new Map<number | null, HTMLButtonElement>());
  const areaCustomRef = useRef<HTMLButtonElement | null>(null);

  const commitCustomField = (
    result: FilterCustomCommitResult,
    presetRefs: Map<number | null, HTMLButtonElement>,
    customRef: { current: HTMLButtonElement | null },
    source: "enter" | "blur",
  ): boolean => {
    if (result.kind === "kept") return false;
    if (source !== "enter") return true;
    const target =
      result.kind === "preset"
        ? presetRefs.get(result.value)
        : customRef.current;
    requestAnimationFrame(() => {
      target?.focus();
    });
    return true;
  };

  const handleClose = () => {
    if (rentCustom.customMode) rentCustom.commit();
    if (areaCustom.customMode) areaCustom.commit();
    onClose();
  };

  useEscapeKey(handleClose, open);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div aria-hidden="true" className={SCRIM_CLASS} onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={SHEET_CLASS}
      >
        <div aria-hidden="true" className={HANDLE_CLASS} />

        <div className={HEAD_CLASS}>
          <h2 id={titleId} className={TITLE_CLASS}>
            {listingsCopy.filters.drawerTitle}
          </h2>
          <button
            type="button"
            className={CLOSE_CLASS}
            aria-label={listingsCopy.filters.drawerClose}
            onClick={handleClose}
          >
            <AppIcon icon={X} size={16} strokeWidth={1.8} decorative />
          </button>
        </div>

        <div className={GROUP_CLASS}>
          <div className={GROUP_LABEL_CLASS}>
            {listingsCopy.filters.coldRent}
          </div>
          <div className={CHIP_ROW_CLASS}>
            {COLD_RENT_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={
                  !rentCustom.customMode && filters.maxColdRent === option.value
                }
                className={filterChipClass(
                  !rentCustom.customMode &&
                    filters.maxColdRent === option.value,
                )}
                ref={(node) => {
                  if (node) rentPresetRefs.current.set(option.value, node);
                  else rentPresetRefs.current.delete(option.value);
                }}
                onClick={() => rentCustom.selectPreset(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={rentCustom.customMode}
              className={filterChipClass(rentCustom.customMode)}
              ref={rentCustomRef}
              onClick={rentCustom.selectCustom}
            >
              {listingsCopy.filters.customAmount}
            </button>
          </div>
          {rentCustom.customMode && (
            <div className={CUSTOM_FIELD_CLASS}>
              <FilterCustomValueInput
                id={rentInputId}
                value={rentCustom.draft}
                suffix={listingsCopy.filters.euroSuffix}
                ariaLabel={listingsCopy.filters.customRentAria}
                onChange={rentCustom.setDraft}
                onCommit={(source) =>
                  commitCustomField(
                    rentCustom.commit(),
                    rentPresetRefs.current,
                    rentCustomRef,
                    source,
                  )
                }
              />
            </div>
          )}
        </div>

        <div className={GROUP_CLASS}>
          <div className={GROUP_LABEL_CLASS}>{listingsCopy.filters.rooms}</div>
          <div className={CHIP_ROW_CLASS}>
            {ROOM_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={filters.minRooms === option.value}
                className={filterChipClass(filters.minRooms === option.value)}
                onClick={() => onChange({ minRooms: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={GROUP_CLASS}>
          <div className={GROUP_LABEL_CLASS}>
            {listingsCopy.filters.livingArea}
          </div>
          <div className={CHIP_ROW_CLASS}>
            {AREA_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={
                  !areaCustom.customMode &&
                  filters.minLivingArea === option.value
                }
                className={filterChipClass(
                  !areaCustom.customMode &&
                    filters.minLivingArea === option.value,
                )}
                ref={(node) => {
                  if (node) areaPresetRefs.current.set(option.value, node);
                  else areaPresetRefs.current.delete(option.value);
                }}
                onClick={() => areaCustom.selectPreset(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={areaCustom.customMode}
              className={filterChipClass(areaCustom.customMode)}
              ref={areaCustomRef}
              onClick={areaCustom.selectCustom}
            >
              {listingsCopy.filters.customValue}
            </button>
          </div>
          {areaCustom.customMode && (
            <div className={CUSTOM_FIELD_CLASS}>
              <FilterCustomValueInput
                id={areaInputId}
                value={areaCustom.draft}
                suffix={listingsCopy.filters.areaSuffix}
                ariaLabel={listingsCopy.filters.customAreaAria}
                onChange={areaCustom.setDraft}
                onCommit={(source) =>
                  commitCustomField(
                    areaCustom.commit(),
                    areaPresetRefs.current,
                    areaCustomRef,
                    source,
                  )
                }
              />
            </div>
          )}
        </div>

        <div className={GROUP_CLASS}>
          <label className={GROUP_LABEL_CLASS} htmlFor={dateId}>
            {listingsCopy.filters.availableFromLabel}
          </label>
          <Input
            id={dateId}
            type="date"
            value={filters.availableFrom ?? ""}
            onChange={(event) =>
              onChange({ availableFrom: event.target.value || null })
            }
          />
        </div>

        <button
          type="button"
          className={buttonClass("ghost", "mb-2 w-full justify-center")}
          onClick={onReset}
        >
          {listingsCopy.filters.reset}
        </button>
        <button
          type="button"
          className={buttonClassWithSize(
            "primary",
            "md",
            "w-full justify-center",
          )}
          onClick={handleClose}
        >
          {listingsCopy.filters.drawerApply(resultCount)}
        </button>
      </div>
    </>
  );
}
