import { listingDetailCopy } from "../copy/listing-detail";
import { cn } from "@/lib/utils/cn";
import type { ListingDetail } from "../types";
import {
  formatArea,
  formatDate,
  formatDepositMonths,
  formatEUR,
  formatRooms,
} from "../utils/format";
import { DetailCard } from "./DetailCard";

interface FactsCardProps {
  listing: ListingDetail;
  className?: string;
}

interface Fact {
  readonly label: string;
  readonly value: string;
}

const GRID_CLASS = "grid grid-cols-2 gap-x-4.5 gap-y-3.5";
const TERM_CLASS =
  "mb-1 font-mono text-meta tracking-normal text-foreground-tertiary uppercase";
const VALUE_CLASS =
  "font-display text-action font-medium text-foreground tabular-nums";

function buildFacts(listing: ListingDetail): Fact[] {
  const { facts } = listingDetailCopy;
  const rows: Fact[] = [];
  const push = (label: string, value: string | null) => {
    if (value !== null) rows.push({ label, value });
  };

  push(
    facts.coldRent,
    listing.coldRent !== null ? formatEUR(listing.coldRent) : null,
  );
  push(
    facts.additionalCosts,
    listing.additionalCosts !== null
      ? formatEUR(listing.additionalCosts)
      : null,
  );
  push(
    facts.deposit,
    listing.deposit !== null ? formatEUR(listing.deposit) : null,
  );
  push(
    facts.depositMonths,
    listing.depositMonths !== null
      ? formatDepositMonths(listing.depositMonths)
      : null,
  );
  push(
    facts.livingArea,
    listing.livingArea !== null ? formatArea(listing.livingArea) : null,
  );
  push(facts.rooms, listing.rooms !== null ? formatRooms(listing.rooms) : null);
  push(
    facts.bedrooms,
    listing.bedrooms !== null ? formatRooms(listing.bedrooms) : null,
  );
  push(facts.availableFrom, formatDate(listing.availableFrom));

  return rows;
}

export function FactsCard({ listing, className }: FactsCardProps) {
  const facts = buildFacts(listing);
  if (facts.length === 0) return null;

  return (
    <DetailCard
      title={listingDetailCopy.facts.title}
      className={cn("bg-background-subtle", className)}
    >
      <dl className={GRID_CLASS}>
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className={TERM_CLASS}>{fact.label}</dt>
            <dd className={VALUE_CLASS}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </DetailCard>
  );
}
