"use client";

import { useCallback, useMemo, useState } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { buttonClass } from "@/components/ui/button/Button";
import { FlashToast } from "@/components/ui/toast/FlashToast";
import { ListingsTopbarActions } from "@/features/applicant/navigation/components/ListingsTopbarActions";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { usePublicListings } from "../hooks/usePublicListings";
import type { ListingsFetchStatus } from "../hooks/usePublicListings";
import { listingsCopy } from "../copy/listings";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters, SortKey } from "../types";
import { FilterDrawer } from "./FilterDrawer";
import { ListingCard } from "./ListingCard";
import { ListingsEmptyState } from "./ListingsEmptyState";
import { ListingsErrorBanner } from "./ListingsErrorBanner";
import { ListingsLoadingGrid } from "./ListingsLoadingGrid";
import { ProfileNotice } from "./ProfileNotice";
import { ResultsBar } from "./ResultsBar";
import { SearchConsole } from "./SearchConsole";

export type { ListingsFetchStatus };

const LISTING_GRID_CLASS =
  "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

const RETURN_TO = "/listings";
const CONTENT_CLASS = "px-gutter pt-10";
const KICKER_CLASS =
  "mb-3 font-mono text-meta uppercase text-foreground-tertiary";
const TITLE_CLASS =
  "mb-2.5 max-w-2xl font-display text-heading-xl font-medium text-foreground";
const LEAD_CLASS = "mb-6 max-w-2xl text-lead text-foreground-secondary";
const LOAD_MORE_WRAPPER_CLASS = "mt-8 flex justify-center";

export function ApplicantListingsView() {
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
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

  const updateFilters = useCallback((patch: Partial<ListingFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

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
      <AppTopbar>
        <ListingsTopbarActions />
      </AppTopbar>

      <div className={CONTENT_CLASS}>
        <ProfileNotice returnTo={RETURN_TO} />

        <div className={KICKER_CLASS}>{listingsCopy.hero.kicker}</div>
        <h1 className={TITLE_CLASS}>{listingsCopy.hero.title}</h1>
        <p className={LEAD_CLASS}>{listingsCopy.hero.lead}</p>

        <SearchConsole
          filters={filters}
          showMatchToggle={hasProfile}
          onChange={updateFilters}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

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
