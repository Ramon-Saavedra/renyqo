import Image from "next/image";
import { Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { DateTimeBadge } from "@/components/ui/date-time-badge/DateTimeBadge";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";
import type { ListingOverviewItem, RowAction } from "../types";
import {
  formatArea,
  formatDateTime,
  formatEUR,
  formatRelative,
} from "../utils/format";
import { AttentionPill } from "./AttentionPill";
import { ApplicationsMeter } from "./ApplicationsMeter";
import { RowActionsMenu } from "./RowActionsMenu";
import { StatusPill } from "./StatusPill";

interface ListingRowProps {
  listing: ListingOverviewItem;
  onAction: (action: RowAction, listing: ListingOverviewItem) => void;
  actionStatus?: string | undefined;
  now?: Date | null;
}

const ROW_BASE_CLASS =
  "cursor-pointer rounded-md border border-border/50 bg-background-subtle px-4 py-4 transition-colors hover:border-border focus-visible:outline-none focus-visible:shadow-focus sm:px-5";
const ROW_INACTIVE_CLASS = "opacity-75";

const ROW_CONTENT_CLASS = "flex flex-col gap-3.5 sm:flex-row sm:gap-4";

const THUMBNAIL_CLASS =
  "aspect-[4/3] w-full shrink-0 rounded object-cover sm:h-24 sm:w-24 sm:aspect-auto";

const THUMBNAIL_FALLBACK_CLASS =
  "flex aspect-[4/3] w-full shrink-0 items-center justify-center rounded-md bg-background-subtle text-primary sm:h-24 sm:w-24 sm:aspect-auto";

const DETAILS_CLASS = "min-w-0 flex-1";

const MAIN_CLASS =
  "mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

const TITLE_BLOCK_CLASS = "flex min-w-0 flex-1 flex-col gap-1";

const TITLE_BASE = "truncate font-sans text-action font-medium text-foreground";
const TITLE_INACTIVE = "text-foreground-secondary";

const ADDRESS_CLASS =
  "flex min-w-0 items-center gap-1.5 text-caption text-foreground-secondary";
const ADDRESS_TEXT_CLASS = "truncate";

const HEADER_META_CLASS =
  "flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end";

const STATUS_CLUSTER_CLASS = "flex flex-wrap items-center gap-1.5";

const STAT_CELL_CLASS = "flex min-w-0 flex-col gap-0.5";

const STAT_KICKER_CLASS =
  "truncate font-mono text-meta tracking-normal text-foreground-tertiary";
const STAT_VALUE_BASE =
  "truncate font-mono text-caption text-foreground tabular-nums";
const STAT_VALUE_INACTIVE = "text-foreground-secondary";
const STAT_VALUE_SOFT =
  "min-w-0 truncate font-mono text-caption text-foreground-secondary tabular-nums";

const BEW_CELL_CLASS = "flex min-w-0 flex-wrap items-center gap-1.5";

const ACTIONS_CELL_CLASS = "flex items-center justify-end gap-1.5";

export function ListingRow({
  listing,
  onAction,
  actionStatus,
  now,
}: ListingRowProps) {
  const isInactive = listing.status === "archived";
  const visibleCount = Math.min(listing.applicationsTotal, 5);
  const waitingCount = Math.max(listing.applicationsTotal - 5, 0);
  const actionPending = Boolean(actionStatus);
  const timestamp = listing.publishedAt ?? listing.updatedAt;
  const timestampLabel = formatDateTime(timestamp);
  const timestampTitle = listing.publishedAt
    ? `Veröffentlicht am ${timestampLabel}`
    : `Aktualisiert am ${timestampLabel}`;

  return (
    <article
      className={cn(ROW_BASE_CLASS, isInactive && ROW_INACTIVE_CLASS)}
      data-status={listing.status}
      role="button"
      tabIndex={0}
      aria-label={listingsCopy.actions.details}
      onClick={() => onAction("details", listing)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onAction("details", listing);
      }}
    >
      <div className={ROW_CONTENT_CLASS}>
        {listing.coverImageUrl ? (
          <Image
            src={listing.coverImageUrl}
            alt=""
            aria-hidden="true"
            width={192}
            height={192}
            quality={90}
            className={THUMBNAIL_CLASS}
          />
        ) : (
          <div aria-hidden="true" className={THUMBNAIL_FALLBACK_CLASS}>
            <AppIcon icon={Home} size={22} strokeWidth={1.8} decorative />
          </div>
        )}

        <div className={DETAILS_CLASS}>
          <div className={MAIN_CLASS}>
            <div className={TITLE_BLOCK_CLASS}>
              <h3 className={cn(TITLE_BASE, isInactive && TITLE_INACTIVE)}>
                {listing.title}
              </h3>
              <div className={ADDRESS_CLASS}>
                <span className={ADDRESS_TEXT_CLASS}>
                  {listing.displayAddress}
                </span>
              </div>
            </div>
            <div className={HEADER_META_CLASS}>
              <div className={STATUS_CLUSTER_CLASS}>
                <StatusPill status={listing.status} />
                {listing.needsAttention && listing.attentionReason && (
                  <AttentionPill reason={listing.attentionReason} />
                )}
              </div>
              <DateTimeBadge
                value={timestampLabel}
                title={timestampTitle}
                className="h-7 px-2 text-meta"
              />
            </div>
          </div>

          <div className="listings-row-stats">
            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.coldRent}
              </span>
              <span
                className={cn(
                  STAT_VALUE_BASE,
                  isInactive && STAT_VALUE_INACTIVE,
                )}
              >
                {formatEUR(listing.coldRent)}
              </span>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.deposit}
              </span>
              <span
                className={cn(
                  STAT_VALUE_BASE,
                  isInactive && STAT_VALUE_INACTIVE,
                )}
              >
                {formatEUR(listing.deposit ?? 0)}
              </span>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.depositMonths}
              </span>
              <span
                className={cn(
                  STAT_VALUE_BASE,
                  isInactive && STAT_VALUE_INACTIVE,
                )}
              >
                {listing.depositMonths ?? "—"}
              </span>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.livingArea}
              </span>
              <span
                className={cn(
                  STAT_VALUE_BASE,
                  isInactive && STAT_VALUE_INACTIVE,
                )}
              >
                {formatArea(listing.livingArea)}
              </span>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.rooms}
              </span>
              <span
                className={cn(
                  STAT_VALUE_BASE,
                  isInactive && STAT_VALUE_INACTIVE,
                )}
              >
                {listing.rooms}
              </span>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.applications}
              </span>
              <div className={BEW_CELL_CLASS}>
                <ApplicationsMeter active={visibleCount} />
                <span className={STAT_VALUE_SOFT}>
                  {listingsCopy.row.applicationsLabel(
                    visibleCount,
                    waitingCount,
                  )}
                </span>
              </div>
            </div>

            <div className={STAT_CELL_CLASS}>
              <span className={STAT_KICKER_CLASS}>
                {listingsCopy.row.activity}
              </span>
              <span className={STAT_VALUE_SOFT}>
                {formatRelative(listing.updatedAt, now)}
              </span>
            </div>

            <div className={ACTIONS_CELL_CLASS}>
              <RowActionsMenu
                listing={listing}
                onAction={onAction}
                disabled={actionPending}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
