"use client";

import { SlidersHorizontal } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  AREA_OPTIONS,
  COLD_RENT_OPTIONS,
  listingsCopy,
  ROOM_OPTIONS,
} from "../copy/listings";
import type { ListingFilters } from "../types";
import { countActiveFilters } from "../utils/filter";
import { AvailabilityFilter } from "./AvailabilityFilter";
import { FilterSelect } from "./FilterSelect";
import { SearchField } from "./SearchField";
import { filterChipClass } from "./filter-chip";

interface SearchConsoleProps {
  filters: ListingFilters;
  showMatchToggle: boolean;
  onChange: (patch: Partial<ListingFilters>) => void;
  onOpenDrawer: () => void;
}

const CONSOLE_CLASS =
  "flex flex-wrap items-center gap-2.5 rounded-md border border-border bg-background-muted px-4 py-3.5";

const DIVIDER_CLASS = "mx-1 hidden h-6 w-px bg-border xl:block";

const DESKTOP_ONLY_CLASS = "hidden xl:inline-flex";

const COUNT_CLASS =
  "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-meta tracking-normal text-primary-foreground";

export function SearchConsole({
  filters,
  showMatchToggle,
  onChange,
  onOpenDrawer,
}: SearchConsoleProps) {
  const drawerCount = countActiveFilters({ ...filters, onlyMatching: false });

  return (
    <section aria-label={listingsCopy.console.ariaLabel}>
      <div className={CONSOLE_CLASS}>
        <SearchField
          value={filters.query}
          onChange={(query) => onChange({ query })}
        />

        <span aria-hidden="true" className={DIVIDER_CLASS} />

        <FilterSelect
          label={listingsCopy.filters.coldRent}
          value={filters.maxColdRent}
          options={COLD_RENT_OPTIONS}
          onChange={(maxColdRent) => onChange({ maxColdRent })}
        />
        <FilterSelect
          label={listingsCopy.filters.rooms}
          value={filters.minRooms}
          options={ROOM_OPTIONS}
          onChange={(minRooms) => onChange({ minRooms })}
        />
        <FilterSelect
          label={listingsCopy.filters.livingArea}
          value={filters.minLivingArea}
          options={AREA_OPTIONS}
          onChange={(minLivingArea) => onChange({ minLivingArea })}
          className={DESKTOP_ONLY_CLASS}
        />
        <AvailabilityFilter
          value={filters.availableFrom}
          onChange={(availableFrom) => onChange({ availableFrom })}
          className={DESKTOP_ONLY_CLASS}
        />

        <button
          type="button"
          className={filterChipClass(drawerCount > 0, "xl:hidden")}
          onClick={onOpenDrawer}
        >
          <AppIcon
            icon={SlidersHorizontal}
            size={13}
            strokeWidth={1.6}
            decorative
          />
          {listingsCopy.filters.mobileTrigger}
          {drawerCount > 0 && (
            <span className={COUNT_CLASS}>{drawerCount}</span>
          )}
        </button>

        {showMatchToggle && (
          <>
            <span aria-hidden="true" className={DIVIDER_CLASS} />

            <button
              type="button"
              aria-pressed={filters.onlyMatching}
              title={listingsCopy.console.onlyMatchingHint}
              className={filterChipClass(
                filters.onlyMatching,
                "w-full justify-center xl:ml-auto xl:w-auto",
                "toggle",
              )}
              onClick={() => onChange({ onlyMatching: !filters.onlyMatching })}
            >
              {listingsCopy.console.onlyMatching}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
