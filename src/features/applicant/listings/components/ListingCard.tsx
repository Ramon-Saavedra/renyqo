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
import { resolveListingApplicationUi } from "../utils/listing-card-badge";
import { ApplicantListingAttentionLink } from "@/components/shared/attention/ApplicantListingAttentionLink";
import { ListingCardSaveButton } from "./ListingCardSaveButton";
import { ListingSignals } from "./ListingSignals";
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

const BADGE_SLOT_CLASS = "flex min-h-5 flex-wrap items-center gap-1";

/** Reserved on every card so grid rows stay equal height with or without attention. */
const ATTENTION_SLOT_CLASS = "flex h-6 shrink-0 items-center";

export function ListingCard({
  listing,
  href,
  session,
  showMatch = true,
  eager = false,
  onSavedChange,
}: ListingCardProps) {
  const ui = resolveListingApplicationUi({
    admission: listing.admission,
    matchesProfile:
      listing.matchesProfile === true
        ? "match"
        : listing.matchesProfile === false
          ? "no-match"
          : "unknown",
    publicReason: listing.publicReason,
    showMatch,
  });

  return (
    <div className={CARD_SHELL_CLASS}>
      <div className={`${CARD_CLASS} relative`}>
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-md focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={listing.title}
        />
        <div className="relative z-[1] flex h-full flex-col gap-2.5 pointer-events-none">
          <div className={ATTENTION_SLOT_CLASS}>
            <ApplicantListingAttentionLink
              attention={listing.applicationAttention}
              className="pointer-events-auto inline-flex rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
            />
          </div>
          <div className="relative">
            <ListingCardSaveButton
              listingId={listing.id}
              isSaved={listing.isSaved}
              session={session}
              {...(onSavedChange ? { onSavedChange } : {})}
            />
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
          </div>

          <div className={BADGE_SLOT_CLASS}>
            <ListingSignals ui={ui} surface="card" />
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
        </div>
      </div>
    </div>
  );
}
