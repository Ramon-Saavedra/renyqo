import { MapPin } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../../copy/listing-detail";
import type { ListingViewerSessionStatus } from "../../hooks/useListingViewerSession";
import type { PublicListingDetail } from "../../types";
import { formatEUR } from "../../utils/format";
import { ListingApplyBox } from "./ListingApplyBox";
import { ListingReportAction } from "./ListingReportAction";
import { ListingSaveAction } from "./ListingSaveAction";

interface ListingDetailHeaderProps {
  listing: PublicListingDetail;
  session: ListingViewerSessionStatus;
}

const ROW_CLASS = "flex flex-wrap items-start justify-between gap-4 gap-y-5";

const TITLE_CLASS =
  "mb-2 font-display text-title font-medium text-balance text-foreground";

const ADDRESS_CLASS =
  "flex items-center gap-1.5 text-caption text-foreground-tertiary";

const PRICE_CLASS =
  "mt-1.5 font-display text-action font-semibold text-primary tabular-nums";

const SERVICE_CHARGE_CLASS =
  "ml-1.5 font-sans text-caption font-normal text-foreground-tertiary tabular-nums";

function buildAddressLine(listing: PublicListingDetail): string {
  const address = [listing.street, listing.location].filter(
    (value): value is string => value !== null,
  );
  return address.join(", ");
}

export function ListingDetailHeader({
  listing,
  session,
}: ListingDetailHeaderProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="min-w-0">
        {listing.title && <h1 className={TITLE_CLASS}>{listing.title}</h1>}

        {buildAddressLine(listing) && (
          <p className={ADDRESS_CLASS}>
            <AppIcon
              icon={MapPin}
              size={12}
              strokeWidth={1.8}
              decorative
              className="opacity-70"
            />
            {buildAddressLine(listing)}
          </p>
        )}

        {listing.coldRent !== null && (
          <p className={PRICE_CLASS}>
            {listingDetailCopy.price.cold(formatEUR(listing.coldRent))}
            {listing.additionalCosts !== null &&
              listing.additionalCosts > 0 && (
                <span className={SERVICE_CHARGE_CLASS}>
                  {listingDetailCopy.price.serviceCharge(
                    formatEUR(listing.additionalCosts),
                  )}
                </span>
              )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-start gap-1">
          <ListingSaveAction
            listingId={listing.id}
            isSaved={listing.isSaved}
            session={session}
          />
          <ListingReportAction listingId={listing.id} session={session} />
        </div>
      </div>

      <ListingApplyBox
        listingId={listing.id}
        session={session}
        matchesProfile={listing.matchesProfile}
        applicationStatus={listing.applicationStatus}
        publicReason={listing.publicReason}
      />
    </div>
  );
}
