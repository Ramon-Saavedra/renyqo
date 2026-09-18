"use client";

import { useMemo, useState } from "react";
import { buttonClass } from "@/components/ui/button/Button";
import { FlashToast } from "@/components/ui/toast/FlashToast";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { listingsCopy } from "../copy/listings";
import { useListingViewerSession } from "../hooks/useListingViewerSession";
import { useListingsSearchState } from "../hooks/useListingsSearchState";
import { usePublicListings } from "../hooks/usePublicListings";
import type { ListingsFetchStatus } from "../hooks/usePublicListings";
import {
  LISTINGS_CONTENT_CLASS,
  LISTINGS_LEAD_CLASS,
  LISTINGS_TITLE_CLASS,
} from "./listings-layout-classes";
import { FilterDrawer } from "./FilterDrawer";
import { AnimatedHeroTitle } from "./AnimatedHeroTitle";
import { ListingCard } from "./ListingCard";
import { LISTING_GRID_CLASS } from "./listing-grid-classes";
import { ListingsEmptyState } from "./ListingsEmptyState";
import { ListingsErrorBanner } from "./ListingsErrorBanner";
import { ListingsLoadingGrid } from "./ListingsLoadingGrid";
import { ProfileNotice } from "./ProfileNotice";
import { ResultsBar } from "./ResultsBar";
import { SearchConsole } from "./SearchConsole";

export type { ListingsFetchStatus };

const RETURN_TO = "/listings";
const LOAD_MORE_WRAPPER_CLASS = "mt-8 flex justify-center";

export function ApplicantListingsView() {
  const session = useListingViewerSession();
  const { filters, sort, updateFilters, resetFilters, setSort } =
    useListingsSearchState();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const profileStatus = useApplicantProfileStatus();
  const hasProfile = profileStatus === "exists";

  const {
    listings,
    total,
    nextCursor,
    fetchStatus,
    loadMore,
    retry,
    retryMore,
  } = usePublicListings(filters, sort, hasProfile);

  const isError = fetchStatus === "error-page" || fetchStatus === "error-more";
  const isInitialLoading = fetchStatus === "loading-page";
  const isLoadingMore = fetchStatus === "loading-more";
  const hasMore = nextCursor !== null;
  const showGrid = listings.length > 0 || fetchStatus === "loading-page";

  // Mark the first three listings that have a cover image as eager.
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
      <div className={LISTINGS_CONTENT_CLASS}>
        <ProfileNotice returnTo={RETURN_TO} />

        <AnimatedHeroTitle className={LISTINGS_TITLE_CLASS} />
        <p className={LISTINGS_LEAD_CLASS}>{listingsCopy.hero.lead}</p>

        <SearchConsole
          filters={filters}
          showMatchToggle={hasProfile}
          onChange={updateFilters}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        {session === "error" && (
          <div className="mt-6">
            <ListingsErrorBanner
              message={listingsCopy.error.session}
              onRetry={invalidateCurrentUser}
            />
          </div>
        )}

        {isError && (
          <div className="mt-6">
            <ListingsErrorBanner
              onRetry={fetchStatus === "error-more" ? retryMore : retry}
            />
          </div>
        )}

        <ResultsBar count={total} sort={sort} onSortChange={setSort} />

        {isInitialLoading ? (
          <ListingsLoadingGrid />
        ) : !showGrid && fetchStatus === "idle" ? (
          <ListingsEmptyState onReset={resetFilters} />
        ) : (
          <>
            <ul
              className={LISTING_GRID_CLASS}
              aria-label={listingsCopy.results.gridAriaLabel}
            >
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard
                    listing={listing}
                    href={`/listings/${listing.id}`}
                    session={session}
                    showMatch={hasProfile}
                    eager={eagerIds.has(listing.id)}
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

      <FilterDrawer
        open={drawerOpen}
        filters={filters}
        resultCount={total}
        onChange={updateFilters}
        onReset={resetFilters}
        onClose={() => setDrawerOpen(false)}
      />

      <FlashToast />
    </>
  );
}
