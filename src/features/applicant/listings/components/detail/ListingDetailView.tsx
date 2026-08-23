"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { ListingsTopbarActions } from "../../../navigation/components/ListingsTopbarActions";
import { listingDetailCopy } from "../../copy/listing-detail";
import { usePublicListingDetail } from "../../hooks/usePublicListingDetail";
import { ListingDescription } from "./ListingDescription";
import { ListingDetailHeader } from "./ListingDetailHeader";
import { ListingDetailMessage } from "./ListingDetailMessage";
import { ListingDetailSkeleton } from "./ListingDetailSkeleton";
import { ListingFactsRow } from "./ListingFactsRow";
import { ListingPhotoMosaic } from "./ListingPhotoMosaic";
import { ListingRequirements } from "./ListingRequirements";

interface ListingDetailViewProps {
  listingId: string;
}

const BACK_ROW_CLASS = "px-gutter pt-3.5";

const BACK_LINK_CLASS =
  "inline-flex items-center gap-1.5 text-caption text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const CONTENT_CLASS = "px-gutter pt-4.5 pb-11";

export function ListingDetailView({ listingId }: ListingDetailViewProps) {
  const { listing, error, status } = usePublicListingDetail(listingId);

  return (
    <>
      <AppTopbar>
        <ListingsTopbarActions />
      </AppTopbar>

      <div className={BACK_ROW_CLASS}>
        <Link href={listingDetailCopy.backHref} className={BACK_LINK_CLASS}>
          <AppIcon icon={ArrowLeft} size={14} strokeWidth={2} decorative />
          {listingDetailCopy.backLabel}
        </Link>
      </div>

      <div className={CONTENT_CLASS}>
        {status === "loading" && <ListingDetailSkeleton />}

        {status === "not-found" && (
          <ListingDetailMessage
            tone="not-found"
            title={listingDetailCopy.notFoundTitle}
            lead={listingDetailCopy.notFoundLead}
          />
        )}

        {status === "error" && (
          <ListingDetailMessage
            tone="error"
            title={error ?? listingDetailCopy.errorDefault}
            lead={listingDetailCopy.errorLead}
          />
        )}

        {status === "loaded" && listing && (
          <>
            <ListingDetailHeader listing={listing} />

            <ListingPhotoMosaic
              images={listing.images}
              title={listing.title}
              className="mt-6 mb-7"
            />

            <ListingFactsRow listing={listing} className="mb-6.5" />

            <ListingDescription
              text={listing.shortDescription}
              className="mb-6.5"
            />

            <ListingRequirements listing={listing} />
          </>
        )}
      </div>
    </>
  );
}
