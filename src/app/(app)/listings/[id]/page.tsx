"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { usePublicListingDetail } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import { listingsCopy } from "@/features/applicant/listings/copy/listings";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { listing, error, status } = usePublicListingDetail(id);

  return (
    <PageShell>
      {status === "loading" && (
        <div className="p-10">
          <p className="text-caption text-foreground-tertiary">
            {listingsCopy.detail.loading}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="p-10">
          <p className="text-caption text-foreground-secondary">{error}</p>
          <Link
            href="/listings"
            className="mt-4 inline-block text-caption text-primary underline"
          >
            {listingsCopy.detail.backLink}
          </Link>
        </div>
      )}

      {status === "not-found" && (
        <div className="p-10">
          <h1 className="font-display text-heading-lg font-medium text-foreground">
            {listingsCopy.detail.notFoundTitle}
          </h1>
          <p className="mt-2 text-caption text-foreground-secondary">
            {listingsCopy.detail.notFoundLead}
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-block text-caption text-primary underline"
          >
            {listingsCopy.detail.backLink}
          </Link>
        </div>
      )}

      {status === "loaded" && listing && (
        <div className="p-10">
          <h1 className="font-display text-heading-xl font-medium text-foreground">
            {listing.title}
          </h1>
        </div>
      )}
    </PageShell>
  );
}
