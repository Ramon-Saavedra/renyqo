"use client";

import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";
import type { ListingViewerSessionStatus } from "../hooks/useListingViewerSession";
import type { PublicListing } from "../types";
import {
  formatArea,
  formatAvailability,
  formatEUR,
  formatRooms,
} from "../utils/format";
import { resolveListingCardBadge } from "../utils/listing-card-badge";
import { ListingCardSaveButton } from "./ListingCardSaveButton";
import { MatchBadge } from "./MatchBadge";

interface ListingCardProps {
  listing: PublicListing;
  href: string;
  session: ListingViewerSessionStatus;
  showMatch?: boolean;
  eager?: boolean;
  onSavedChange?: (saved: boolean) => void;
}

const CARD_SHELL_CLASS = "relative h-full";

const CARD_CLASS =
  "flex h-full flex-col gap-2.5 rounded-md focus-visible:outline-none focus-visible:shadow-focus";

const MEDIA_CLASS =
  "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-media-placeholder";

const MEDIA_IMAGE_CLASS = "h-full w-full object-cover";

const MEDIA_FALLBACK_CLASS =
  "flex flex-col items-center gap-1.5 font-mono text-meta uppercase text-foreground-tertiary";

const MEDIA_FALLBACK_ICON_CLASS = "text-primary";

const BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-1";

const TITLE_CLASS =
  "line-clamp-2 min-h-10 overflow-hidden break-words font-display text-caption font-medium text-foreground";

const LOCATION_CLASS =
  "truncate text-meta tracking-normal text-foreground-secondary";

const STATS_CLASS =
  "flex flex-wrap items-center gap-x-1 font-mono text-meta tracking-normal text-foreground-tertiary tabular-nums";

const STATS_ITEM_CLASS = "whitespace-nowrap";

const STATS_AVAILABLE_CLASS = "basis-full whitespace-nowrap";

const PRICE_ROW_CLASS = "mt-auto flex flex-wrap items-baseline gap-x-1.5";

const PRICE_CLASS =
  "whitespace-nowrap font-mono text-body font-semibold text-foreground tabular-nums";

const PRICE_LABEL_CLASS =
  "whitespace-nowrap text-meta tracking-normal text-foreground-tertiary";

const SERVICE_CHARGE_CLASS =
  "basis-full whitespace-nowrap font-mono text-meta tracking-normal text-foreground-tertiary tabular-nums";

const BADGE_SLOT_CLASS = "flex h-5 items-center";

export function ListingCard({
  listing,
  href,
  session,
  showMatch = true,
  eager = false,
  onSavedChange,
}: ListingCardProps) {
  const badge = resolveListingCardBadge({
    applicationStatus: listing.applicationStatus,
    publicReason: listing.publicReason,
    matchesProfile: listing.matchesProfile,
    showMatch,
  });

  return (
    <div className={CARD_SHELL_CLASS}>
      <Link href={href} className={CARD_CLASS}>
        <div className={MEDIA_CLASS}>
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt=""
              aria-hidden="true"
              width={640}
              height={640}
              quality={90}
              loading={eager ? "eager" : undefined}
              sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={MEDIA_IMAGE_CLASS}
            />
          ) : (
            <span className={MEDIA_FALLBACK_CLASS}>
              <AppIcon
                icon={Home}
                size={20}
                strokeWidth={1.8}
                decorative
                className={MEDIA_FALLBACK_ICON_CLASS}
              />
              {listingsCopy.card.noImage}
            </span>
          )}

          {listing.isNew && (
            <MatchBadge tone="new" className="absolute top-2 left-2">
              {listingsCopy.card.badgeNew}
            </MatchBadge>
          )}
        </div>

        <div className={BADGE_SLOT_CLASS}>
          {badge === "applied" && (
            <MatchBadge tone="new">{listingsCopy.card.badgeApplied}</MatchBadge>
          )}

          {badge === "not-selected" && (
            <MatchBadge tone="not-selected">
              {listingsCopy.card.badgeNotSelected}
            </MatchBadge>
          )}

          {badge === "match" && (
            <MatchBadge tone="match">{listingsCopy.card.badgeMatch}</MatchBadge>
          )}

          {badge === "no-match" && (
            <MatchBadge tone="no-match">
              {listingsCopy.card.badgeNoMatch}
            </MatchBadge>
          )}
        </div>

        <div className={BODY_CLASS}>
          <h3 className={TITLE_CLASS}>{listing.title}</h3>
          <span className={LOCATION_CLASS}>{listing.location}</span>

          <div className={STATS_CLASS}>
            <span className={STATS_ITEM_CLASS}>
              {formatRooms(listing.rooms)}
            </span>
            <span className={STATS_ITEM_CLASS}>
              {` · ${formatArea(listing.livingArea)}`}
            </span>
            <span className={STATS_AVAILABLE_CLASS}>
              {listingsCopy.card.availableFrom(
                formatAvailability(listing.availableFrom),
              )}
            </span>
          </div>

          <div className={PRICE_ROW_CLASS}>
            <span className={PRICE_CLASS}>{formatEUR(listing.coldRent)}</span>
            <span className={PRICE_LABEL_CLASS}>
              {listingsCopy.card.coldRent}
            </span>
            <span className={SERVICE_CHARGE_CLASS}>
              {listingsCopy.card.serviceCharge(
                formatEUR(listing.serviceCharge),
              )}
            </span>
          </div>
        </div>
      </Link>
      <ListingCardSaveButton
        listingId={listing.id}
        isSaved={listing.isSaved}
        session={session}
        {...(onSavedChange ? { onSavedChange } : {})}
      />
    </div>
  );
}
