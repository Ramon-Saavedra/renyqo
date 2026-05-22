import { Pencil } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";
import type { ListingOverviewItem, RowAction } from "../types";
import { formatArea, formatEUR, formatRelative } from "../utils/format";
import { AttentionPill } from "./AttentionPill";
import { BewerbungenMeter } from "./BewerbungenMeter";
import { RowActionsMenu } from "./RowActionsMenu";
import { StatusPill } from "./StatusPill";

interface ListingRowProps {
  listing: ListingOverviewItem;
  onAction: (action: RowAction, listing: ListingOverviewItem) => void;
  now?: Date | null;
}

const ROW_BASE_CLASS =
  "rounded-md border border-border/50 bg-card px-5 py-4 transition-colors hover:border-border";
const ROW_INACTIVE_CLASS = "bg-background-subtle";

const MAIN_CLASS = "mb-3.5 flex items-start justify-between gap-4";

const TITLE_BLOCK_CLASS = "flex min-w-0 flex-1 flex-col gap-1";

const TITLE_BASE = "truncate font-sans text-action font-medium text-foreground";
const TITLE_INACTIVE = "text-foreground-secondary";

const ADDRESS_CLASS =
  "flex min-w-0 items-center gap-1.5 text-caption text-foreground-secondary";
const ADDRESS_TEXT_CLASS = "truncate";

const STATUS_CLUSTER_CLASS = "flex shrink-0 items-center gap-1.5";

const STAT_CELL_CLASS = "flex min-w-0 flex-col gap-0.5";

const STAT_KICKER_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const STAT_VALUE_BASE =
  "truncate font-mono text-caption text-foreground tabular-nums";
const STAT_VALUE_INACTIVE = "text-foreground-secondary";
const STAT_VALUE_SOFT =
  "truncate font-mono text-caption text-foreground-secondary tabular-nums";

const BEW_CELL_CLASS = "flex flex-wrap items-center gap-1.5";

const ACTIONS_CELL_CLASS = "flex items-center gap-1.5";

const ICON_BUTTON_CLASS =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-strong text-foreground-secondary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function ListingRow({ listing, onAction, now }: ListingRowProps) {
  const isInactive =
    listing.status === "rented" || listing.status === "archived";
  const visibleCount = Math.min(listing.applicationsTotal, 5);
  const waitingCount = Math.max(listing.applicationsTotal - 5, 0);

  return (
    <article
      className={cn(ROW_BASE_CLASS, isInactive && ROW_INACTIVE_CLASS)}
      data-status={listing.status}
    >
      <div className={MAIN_CLASS}>
        <div className={TITLE_BLOCK_CLASS}>
          <h3 className={cn(TITLE_BASE, isInactive && TITLE_INACTIVE)}>
            {listing.title}
          </h3>
          <div className={ADDRESS_CLASS}>
            <span className={ADDRESS_TEXT_CLASS}>{listing.displayAddress}</span>
          </div>
        </div>
        <div className={STATUS_CLUSTER_CLASS}>
          <StatusPill status={listing.status} />
          {listing.needsAttention && listing.attentionReason && (
            <AttentionPill reason={listing.attentionReason} />
          )}
        </div>
      </div>

      <div className="listings-row-stats">
        <div className={STAT_CELL_CLASS}>
          <span className={STAT_KICKER_CLASS}>{listingsCopy.row.coldRent}</span>
          <span
            className={cn(STAT_VALUE_BASE, isInactive && STAT_VALUE_INACTIVE)}
          >
            {formatEUR(listing.coldRent)}
          </span>
        </div>

        <div className={STAT_CELL_CLASS}>
          <span className={STAT_KICKER_CLASS}>
            {listingsCopy.row.livingArea}
          </span>
          <span
            className={cn(STAT_VALUE_BASE, isInactive && STAT_VALUE_INACTIVE)}
          >
            {formatArea(listing.livingArea)}
          </span>
        </div>

        <div className={STAT_CELL_CLASS}>
          <span className={STAT_KICKER_CLASS}>{listingsCopy.row.rooms}</span>
          <span
            className={cn(STAT_VALUE_BASE, isInactive && STAT_VALUE_INACTIVE)}
          >
            {listing.rooms}
          </span>
        </div>

        <div className={STAT_CELL_CLASS}>
          <span className={STAT_KICKER_CLASS}>
            {listingsCopy.row.applications}
          </span>
          <div className={BEW_CELL_CLASS}>
            <BewerbungenMeter active={visibleCount} />
            <span className={STAT_VALUE_SOFT}>
              {listingsCopy.row.applicationsLabel(visibleCount, waitingCount)}
            </span>
          </div>
        </div>

        <div className={STAT_CELL_CLASS}>
          <span className={STAT_KICKER_CLASS}>{listingsCopy.row.activity}</span>
          <span className={STAT_VALUE_SOFT}>
            {formatRelative(listing.updatedAt, now)}
          </span>
        </div>

        <div className={ACTIONS_CELL_CLASS}>
          <button
            type="button"
            className={ICON_BUTTON_CLASS}
            aria-label={listingsCopy.row.editLabel}
            title={listingsCopy.row.editLabel}
            onClick={() => onAction("edit", listing)}
          >
            <AppIcon icon={Pencil} size={14} strokeWidth={1.6} decorative />
          </button>
          <RowActionsMenu listing={listing} onAction={onAction} />
        </div>
      </div>
    </article>
  );
}
