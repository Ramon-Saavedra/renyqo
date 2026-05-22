import Link from "next/link";
import { DoorOpen, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

export type EmptyStateVariant = "fresh" | "archived-only" | "filtered";

interface ListingsEmptyStateProps {
  variant: EmptyStateVariant;
  onShowAll?: () => void;
  onResetFilters?: () => void;
}

const WRAPPER_CLASS =
  "flex flex-col items-center justify-center gap-6 rounded-md border border-dashed border-border-strong bg-background px-6 py-14 text-center";

const MARK_CLASS =
  "inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary-tint text-primary";

const TITLE_CLASS = "font-display text-title font-medium text-foreground";

const LEAD_CLASS =
  "max-w-md text-caption leading-snug text-foreground-secondary";

const ACTIONS_CLASS = "flex flex-wrap items-center justify-center gap-2.5";

export function ListingsEmptyState({
  variant,
  onShowAll,
  onResetFilters,
}: ListingsEmptyStateProps) {
  const copy = listingsCopy.empty;
  const isFresh = variant === "fresh";
  const isFiltered = variant === "filtered";

  const title = isFresh
    ? copy.titleFresh
    : isFiltered
      ? copy.filteredTitle
      : copy.titleArchived;

  const lead = isFresh
    ? copy.leadFresh
    : isFiltered
      ? copy.filteredLead
      : copy.leadArchived;

  return (
    <div className={WRAPPER_CLASS}>
      <span aria-hidden="true" className={MARK_CLASS}>
        <AppIcon icon={DoorOpen} size={26} strokeWidth={1.6} decorative />
      </span>
      <div className="flex flex-col items-center gap-2">
        <h2 className={TITLE_CLASS}>{title}</h2>
        <p className={LEAD_CLASS}>{lead}</p>
      </div>
      <div className={ACTIONS_CLASS}>
        {isFiltered ? (
          onResetFilters && (
            <button
              type="button"
              className={buttonClass("primary")}
              onClick={onResetFilters}
            >
              {copy.ctaReset}
            </button>
          )
        ) : (
          <>
            <Link
              href={listingsCopy.hero.newHref}
              className={buttonClass("primary")}
            >
              <AppIcon icon={Plus} size={15} strokeWidth={1.8} decorative />
              {copy.ctaNew}
            </Link>
            {variant === "archived-only" && onShowAll && (
              <button
                type="button"
                className={buttonClass("ghost")}
                onClick={onShowAll}
              >
                {copy.ctaShowAll}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
