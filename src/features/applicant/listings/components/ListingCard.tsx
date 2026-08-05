import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";
import type { PublicListing } from "../types";
import {
  formatArea,
  formatAvailability,
  formatEUR,
  formatRooms,
} from "../utils/format";
import { MatchBadge } from "./MatchBadge";

interface ListingCardProps {
  listing: PublicListing;
  href: string;
  showMatch?: boolean;
  eager?: boolean;
}

const CARD_CLASS =
  "flex h-full flex-col gap-2.5 rounded-md focus-visible:outline-none focus-visible:shadow-focus";

const MEDIA_CLASS =
  "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-background-subtle";

const MEDIA_IMAGE_CLASS = "h-full w-full object-cover";

const MEDIA_FALLBACK_CLASS =
  "flex flex-col items-center gap-1.5 font-mono text-meta uppercase text-foreground-tertiary";

const MEDIA_FALLBACK_ICON_CLASS = "text-primary";

const BODY_CLASS = "flex flex-1 flex-col gap-1";

const TITLE_CLASS =
  "line-clamp-2 font-display text-caption font-medium text-foreground";

const LOCATION_CLASS =
  "truncate text-meta tracking-normal text-foreground-secondary";

const STATS_CLASS =
  "flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-meta tracking-normal text-foreground-tertiary tabular-nums";

const PRICE_ROW_CLASS = "mt-0.5 flex flex-wrap items-baseline gap-1.5";

const PRICE_CLASS =
  "font-mono text-body font-semibold text-foreground tabular-nums";

const PRICE_LABEL_CLASS = "text-meta tracking-normal text-foreground-tertiary";

const SERVICE_CHARGE_CLASS =
  "font-mono text-meta tracking-normal text-foreground-tertiary tabular-nums";

export function ListingCard({
  listing,
  href,
  showMatch = true,
  eager = false,
}: ListingCardProps) {
  const match = showMatch ? listing.matchesProfile : null;

  return (
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
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
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

      {match !== null && (
        <MatchBadge tone={match ? "match" : "no-match"}>
          {match
            ? listingsCopy.card.badgeMatch
            : listingsCopy.card.badgeNoMatch}
        </MatchBadge>
      )}

      <div className={BODY_CLASS}>
        <h3 className={TITLE_CLASS}>{listing.title}</h3>
        <span className={LOCATION_CLASS}>{listing.location}</span>

        <div className={STATS_CLASS}>
          <span>{formatRooms(listing.rooms)}</span>
          <span>{formatArea(listing.livingArea)}</span>
          <span>
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
            {listingsCopy.card.serviceCharge(formatEUR(listing.serviceCharge))}
          </span>
        </div>
      </div>
    </Link>
  );
}
