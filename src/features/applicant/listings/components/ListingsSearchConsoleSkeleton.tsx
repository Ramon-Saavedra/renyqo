import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";
import {
  SEARCH_CONSOLE_CLASS,
  SEARCH_CONSOLE_DESKTOP_ONLY_CLASS,
  SEARCH_CONSOLE_DIVIDER_CLASS,
  SEARCH_CONSOLE_SEARCH_CLASS,
  SEARCH_CONSOLE_SEARCH_ICON_CLASS,
} from "./search-console-classes";

const FILTER_CLASS =
  "inline-flex h-9.5 items-center gap-1.5 whitespace-nowrap rounded-md border border-border-strong bg-input px-3.5 text-caption text-foreground";

const MATCH_CLASS = "w-full justify-center xl:ml-auto xl:w-auto";

const MOBILE_FILTER_CLASS = "xl:hidden";

interface FilterSkeletonProps {
  label: string;
  className?: string;
  icon?: LucideIcon;
  iconFirst?: boolean;
}

function FilterSkeleton({
  label,
  className,
  icon = ChevronDown,
  iconFirst = false,
}: FilterSkeletonProps) {
  const iconElement = (
    <AppIcon icon={icon} size={13} strokeWidth={1.6} decorative />
  );

  return (
    <span className={cn(FILTER_CLASS, className)}>
      {iconFirst && iconElement}
      {label}
      {!iconFirst && iconElement}
    </span>
  );
}

export function ListingsSearchConsoleSkeleton() {
  return (
    <section aria-hidden="true">
      <div className={SEARCH_CONSOLE_CLASS}>
        <div className={SEARCH_CONSOLE_SEARCH_CLASS}>
          <div className="relative h-11 w-full rounded-md border border-border-strong bg-input">
            <span
              aria-hidden="true"
              className={SEARCH_CONSOLE_SEARCH_ICON_CLASS}
            >
              <AppIcon icon={Search} size={15} strokeWidth={1.6} decorative />
            </span>
            <RenyqoSkeleton
              width="44%"
              height={11}
              className="absolute top-1/2 left-10 -translate-y-1/2"
            />
          </div>
        </div>

        <span aria-hidden="true" className={SEARCH_CONSOLE_DIVIDER_CLASS} />

        <FilterSkeleton label={listingsCopy.filters.coldRent} />
        <FilterSkeleton label={listingsCopy.filters.rooms} />
        <FilterSkeleton
          label={listingsCopy.filters.livingArea}
          className={SEARCH_CONSOLE_DESKTOP_ONLY_CLASS}
        />
        <FilterSkeleton
          label={listingsCopy.filters.availableFrom}
          className={SEARCH_CONSOLE_DESKTOP_ONLY_CLASS}
        />
        <FilterSkeleton
          label={listingsCopy.filters.mobileTrigger}
          className={MOBILE_FILTER_CLASS}
          icon={SlidersHorizontal}
          iconFirst
        />

        <span aria-hidden="true" className={SEARCH_CONSOLE_DIVIDER_CLASS} />

        <span className={`${FILTER_CLASS} ${MATCH_CLASS}`}>
          {listingsCopy.console.onlyMatching}
        </span>
      </div>
    </section>
  );
}
