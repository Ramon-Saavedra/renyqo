import { Eye } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { VISIBILITY_NOTE, listingDetailCopy } from "../copy/listing-detail";
import type { ListingDetail } from "../types";
import { DetailCard } from "./DetailCard";

interface AddressCardProps {
  listing: ListingDetail;
  className?: string;
}

const ADDRESS_CLASS = "mb-4 text-body leading-normal text-foreground";
const NOTE_CLASS =
  "flex gap-2.5 rounded-sm border border-border bg-background-subtle px-3.5 py-3";
const NOTE_TEXT_CLASS =
  "text-caption leading-relaxed text-foreground-secondary";

export function AddressCard({ listing, className }: AddressCardProps) {
  const zipCity = [listing.zip, listing.city].filter(Boolean).join(" ");
  const hasAddress = Boolean(listing.street || zipCity);

  return (
    <DetailCard title={listingDetailCopy.address.title} className={className}>
      <p className={ADDRESS_CLASS}>
        {hasAddress ? (
          <>
            {listing.street ? (
              <>
                {listing.street}
                {zipCity ? <br /> : null}
              </>
            ) : null}
            {zipCity}
          </>
        ) : (
          listingDetailCopy.address.unknown
        )}
      </p>
      <div className={NOTE_CLASS}>
        <AppIcon
          icon={Eye}
          size={15}
          strokeWidth={1.6}
          decorative
          className="mt-0.5 text-primary"
        />
        <p className={NOTE_TEXT_CLASS}>{VISIBILITY_NOTE[listing.status]}</p>
      </div>
    </DetailCard>
  );
}
