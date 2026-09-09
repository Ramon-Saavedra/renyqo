"use client";

import { useMemo } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { buttonClass } from "@/components/ui/button/Button";
import { ListingsTopbarActions } from "@/features/applicant/navigation/components/ListingsTopbarActions";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { listingsCopy } from "../copy/listings";
import { useSavedListings } from "../hooks/useSavedListings";
import { ListingCard } from "./ListingCard";
import { ListingsErrorBanner } from "./ListingsErrorBanner";
import { ListingsLoadingGrid } from "./ListingsLoadingGrid";
import { SavedListingsEmptyState } from "./SavedListingsEmptyState";

const LISTING_GRID_CLASS =
  "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

const CONTENT_CLASS = "px-gutter pt-10";
const TITLE_CLASS =
  "mb-2.5 max-w-2xl font-display text-heading-xl font-medium text-foreground";
const LEAD_CLASS = "mb-6 max-w-2xl text-lead text-foreground-secondary";
const LOAD_MORE_WRAPPER_CLASS = "mt-8 flex justify-center";

export function SavedListingsView() {
  const profileStatus = useApplicantProfileStatus();
  const hasProfile = profileStatus === "exists";

  const {
    listings,
    nextCursor,
    fetchStatus,
    loadMore,
    retry,
    retryMore,
    removeListing,
  } = useSavedListings();

  const isError = fetchStatus === "error-page" || fetchStatus === "error-more";
  const isLoadingMore = fetchStatus === "loading-more";
  const hasMore = nextCursor !== null;
  const isInitialLoading =
    fetchStatus === "loading-page" ||
    (listings.length === 0 && !isError && (isLoadingMore || hasMore));
  const showEmpty = listings.length === 0 && !hasMore && fetchStatus === "idle";

  const eagerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const listing of listings) {
      if (!listing.coverImageUrl) continue;
      ids.add(listing.id);
      if (ids.size === 3) break;
    }
    return ids;
  }, [listings]);

  return (
    <>
      <AppTopbar>
        <ListingsTopbarActions />
      </AppTopbar>

      <div className={CONTENT_CLASS}>
        <h1 className={TITLE_CLASS}>{listingsCopy.saved.title}</h1>
        <p className={LEAD_CLASS}>{listingsCopy.saved.lead}</p>

        {isError && (
          <div className="mt-6">
            <ListingsErrorBanner
              message={listingsCopy.saved.error}
              onRetry={fetchStatus === "error-more" ? retryMore : retry}
            />
          </div>
        )}

        {isInitialLoading ? (
          <ListingsLoadingGrid />
        ) : showEmpty ? (
          <SavedListingsEmptyState />
        ) : (
          <>
            <ul
              className={LISTING_GRID_CLASS}
              aria-label={listingsCopy.saved.gridAriaLabel}
            >
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard
                    listing={listing}
                    href={`/listings/${listing.id}`}
                    showMatch={hasProfile}
                    eager={eagerIds.has(listing.id)}
                    onSavedChange={(saved) => {
                      if (!saved) removeListing(listing.id);
                    }}
                  />
                </li>
              ))}
            </ul>

            {hasMore && !isError && !isLoadingMore && (
              <div className={LOAD_MORE_WRAPPER_CLASS}>
                <button
                  type="button"
                  className={buttonClass("outline")}
                  onClick={loadMore}
                >
                  {listingsCopy.results.loadMore}
                </button>
              </div>
            )}

            {isLoadingMore && (
              <div className={LOAD_MORE_WRAPPER_CLASS}>
                <span
                  className="text-caption text-foreground-tertiary"
                  aria-live="polite"
                >
                  {listingsCopy.loading}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
