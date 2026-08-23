import { OBJECT_TYPE_LABEL } from "@/lib/api/listings";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../../copy/listing-detail";
import type { PublicListingDetail } from "../../types";
import {
  formatArea,
  formatAvailability,
  formatDecimal,
} from "../../utils/format";

interface ListingFactsRowProps {
  listing: PublicListingDetail;
  className?: string;
}

interface Fact {
  readonly label: string;
  readonly value: string;
}

const ROW_CLASS = "flex flex-wrap border-y border-border";

const FACT_CLASS =
  "grow basis-1/2 py-2 max-sm:border-b max-sm:border-border max-sm:pr-3.5 max-sm:last:border-b-0 sm:basis-0 sm:border-r sm:border-border sm:px-3.5 sm:py-2.5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0";

const TERM_CLASS =
  "mb-1 font-mono text-meta uppercase text-foreground-tertiary";

const VALUE_CLASS =
  "font-display text-body font-medium text-foreground tabular-nums";

const { facts } = listingDetailCopy;

function buildFacts(listing: PublicListingDetail): Fact[] {
  const rows: Fact[] = [];
  const push = (label: string, value: string | null) => {
    if (value !== null) rows.push({ label, value });
  };

  push(
    facts.rooms,
    listing.rooms !== null && listing.rooms > 0
      ? formatDecimal(listing.rooms)
      : null,
  );
  push(
    facts.livingArea,
    listing.livingArea !== null && listing.livingArea > 0
      ? formatArea(listing.livingArea)
      : null,
  );
  push(
    facts.bedrooms,
    listing.bedrooms !== null ? formatDecimal(listing.bedrooms) : null,
  );
  push(
    facts.objectType,
    listing.objectType !== null ? OBJECT_TYPE_LABEL[listing.objectType] : null,
  );
  push(facts.availableFrom, formatAvailability(listing.availableFrom));

  return rows;
}

export function ListingFactsRow({ listing, className }: ListingFactsRowProps) {
  const rows = buildFacts(listing);
  if (rows.length === 0) return null;

  return (
    <dl className={cn(ROW_CLASS, className)}>
      {rows.map((fact) => (
        <div key={fact.label} className={FACT_CLASS}>
          <dt className={TERM_CLASS}>{fact.label}</dt>
          <dd className={VALUE_CLASS}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
