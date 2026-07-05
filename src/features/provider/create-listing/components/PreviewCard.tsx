"use client";

import { Shield } from "lucide-react";
import { Note } from "@/components/ui/form/Note";
import { createListingCopy } from "../copy/create-listing";
import type { ListingDraft } from "../hooks/useListingDraft";

interface PreviewCardProps {
  draft: ListingDraft;
  finalTitle: string;
}

const KICKER_CLASS =
  "flex items-center justify-between font-mono text-meta uppercase text-foreground-tertiary";

const CARD_CLASS =
  "overflow-hidden rounded-md border border-border bg-background";

const PHOTO_CLASS =
  "relative grid aspect-[4/3] place-items-center border-b border-border bg-background-subtle bg-cover bg-center font-mono text-meta uppercase text-foreground-tertiary";

const BADGE_CLASS =
  "absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1 font-mono text-meta uppercase text-foreground-secondary";

const STATS_GRID =
  "grid grid-cols-2 gap-x-3.5 gap-y-2.5 border-t border-border pt-3.5";

function formatPrice(value: string): string | null {
  const n = parseInt(value, 10);
  if (!n || Number.isNaN(n)) return null;
  return n.toLocaleString("de-DE");
}

function formatAvailable(value: string): string {
  if (!value) return createListingCopy.preview.empty;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return createListingCopy.preview.empty;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveAddress(
  city: string,
  zip: string,
  street: string,
  hideAddress: boolean,
): string {
  const copy = createListingCopy.preview;
  if (!city && !zip) return copy.addressPlaceholder;
  const full = [street, [zip, city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (!hideAddress) return full;
  return city || copy.addressHidden;
}

export function PreviewCard({ draft, finalTitle }: PreviewCardProps) {
  const copy = createListingCopy.preview;
  const cover = draft.photos[0];
  const price = formatPrice(draft.price);
  const bedroomsLabel = draft.bedrooms === null ? copy.empty : draft.bedrooms;

  return (
    <aside
      aria-label={copy.kicker}
      className="sticky top-21 flex flex-col gap-3.5"
    >
      <div className={KICKER_CLASS}>
        <span>{copy.kicker}</span>
        <span>{copy.kickerTag}</span>
      </div>

      <div className={CARD_CLASS}>
        <div
          className={PHOTO_CLASS}
          style={cover ? { backgroundImage: `url(${cover.src})` } : undefined}
        >
          <span className={BADGE_CLASS}>
            <span
              aria-hidden="true"
              className="h-1.25 w-1.25 rounded-full bg-foreground-tertiary"
            />
            {copy.badgeDraft}
          </span>
          {!cover && <span>{copy.photoPlaceholder}</span>}
        </div>

        <div className="px-4.5 pt-4.5 pb-5">
          <h3 className="mb-1 font-display text-brand font-medium text-foreground">
            {finalTitle || copy.titlePlaceholder}
          </h3>
          <p className="mb-3.5 text-caption text-foreground-secondary">
            {resolveAddress(
              draft.city,
              draft.zip,
              draft.street,
              draft.hideAddress,
            )}
          </p>
          <div className={STATS_GRID}>
            <PreviewStat
              label={copy.stats.area}
              value={draft.area ? `${draft.area} m²` : copy.empty}
            />
            <PreviewStat
              label={copy.stats.rooms}
              value={draft.rooms ? draft.rooms.replace(".", ",") : copy.empty}
            />
            <PreviewStat label={copy.stats.bedrooms} value={bedroomsLabel} />
            <PreviewStat
              label={copy.stats.availableFrom}
              value={formatAvailable(draft.availableFrom)}
              valueSmall
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-background-subtle px-4.5 py-3.5">
          {price ? (
            <span className="font-display text-title font-medium tabular-nums text-foreground">
              {price} €
              <span className="ml-0.5 text-caption font-normal text-foreground-tertiary">
                {" "}
                {copy.priceUnit}
              </span>
            </span>
          ) : (
            <span className="text-action text-foreground-tertiary">
              {copy.priceMissing}
            </span>
          )}
          <span className="font-mono text-meta uppercase text-foreground-tertiary">
            {copy.priceKicker}
          </span>
        </div>
      </div>

      <Note icon={Shield}>
        {copy.note.body}
        <strong className="font-semibold text-foreground">
          {copy.note.bodyBold}
        </strong>
        {copy.note.bodyTail}
      </Note>
    </aside>
  );
}

interface PreviewStatProps {
  label: string;
  value: React.ReactNode;
  valueSmall?: boolean;
}

function PreviewStat({ label, value, valueSmall = false }: PreviewStatProps) {
  const valueClass = valueSmall
    ? "font-display text-caption font-medium tabular-nums text-foreground"
    : "font-display text-brand font-medium tabular-nums text-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-meta uppercase text-foreground-tertiary">
        {label}
      </span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
