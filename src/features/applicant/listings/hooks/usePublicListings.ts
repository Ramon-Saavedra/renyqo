"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicListings } from "../api/public-listings";
import type {
  ListingFilters,
  PublicListing,
  PublicListingsParams,
  SortKey,
} from "../types";

export type ListingsFetchStatus =
  | "idle"
  | "loading-page"
  | "loading-more"
  | "error-page"
  | "error-more";

export interface UsePublicListingsResult {
  readonly listings: readonly PublicListing[];
  readonly total: number;
  readonly nextCursor: string | null;
  readonly fetchStatus: ListingsFetchStatus;
  readonly loadMore: () => void;
  readonly retry: () => void;
  readonly retryMore: () => void;
}

const PAGE_SIZE = 10;
const QUERY_DEBOUNCE_MS = 300;

/**
 * Shared abort + generation guard for page and load-more fetches.
 * Returns a cleanup function and a stale-checking predicate.
 */
function startFetch(generationRef: React.MutableRefObject<number>): {
  controller: AbortController;
  isStale: () => boolean;
} {
  generationRef.current += 1;
  const generation = generationRef.current;
  const controller = new AbortController();

  return {
    controller,
    isStale: () => generation !== generationRef.current,
  };
}

export function usePublicListings(
  filters: ListingFilters,
  sort: SortKey,
  hasProfile: boolean,
): UsePublicListingsResult {
  const [listings, setListings] = useState<readonly PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] =
    useState<ListingsFetchStatus>("loading-page");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const queryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchGenerationRef = useRef(0);

  // Debounce the search query.
  useEffect(() => {
    const currentQuery = filters.query;
    if (queryTimerRef.current) {
      clearTimeout(queryTimerRef.current);
    }
    queryTimerRef.current = setTimeout(() => {
      setDebouncedQuery(currentQuery);
    }, QUERY_DEBOUNCE_MS);
    return () => {
      if (queryTimerRef.current) {
        clearTimeout(queryTimerRef.current);
      }
    };
  }, [filters.query]);

  // Build API params from current state.
  const buildParams = useCallback(
    (cursor?: string | null): PublicListingsParams => ({
      query: debouncedQuery || undefined,
      maxRent: filters.maxColdRent ?? undefined,
      minRooms: filters.minRooms ?? undefined,
      minLivingArea: filters.minLivingArea ?? undefined,
      availableBy: filters.availableFrom ?? undefined,
      onlyMatching: hasProfile ? filters.onlyMatching || undefined : undefined,
      sort,
      cursor: cursor ?? undefined,
      limit: PAGE_SIZE,
    }),
    [
      debouncedQuery,
      filters.maxColdRent,
      filters.minRooms,
      filters.minLivingArea,
      filters.availableFrom,
      filters.onlyMatching,
      sort,
      hasProfile,
    ],
  );

  // Fetch the first page whenever filters, sort or debounced query change.
  useEffect(() => {
    const { controller, isStale } = startFetch(fetchGenerationRef);

    async function loadPage() {
      setFetchStatus("loading-page");

      try {
        const params = buildParams();
        const response = await getPublicListings(params, {
          signal: controller.signal,
        });

        if (isStale()) return;

        setListings(response.listings);
        setTotal(response.total);
        setNextCursor(response.nextCursor);
        setFetchStatus("idle");
      } catch (err) {
        if (isStale()) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        setFetchStatus("error-page");
      }
    }

    void loadPage();

    return () => controller.abort();
  }, [buildParams, retryCount]);

  // Append the next page when "load more" is clicked.
  const handleLoadMore = useCallback(() => {
    const cursor = nextCursor;
    if (cursor === null) return;

    const { controller, isStale } = startFetch(fetchGenerationRef);

    async function append() {
      setFetchStatus("loading-more");

      try {
        const params = buildParams(cursor);
        const response = await getPublicListings(params, {
          signal: controller.signal,
        });

        if (isStale()) return;

        setListings((current) => [...current, ...response.listings]);
        setTotal(response.total);
        setNextCursor(response.nextCursor);
        setFetchStatus("idle");
      } catch (err) {
        if (isStale()) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        setFetchStatus("error-more");
      }
    }

    void append();
  }, [nextCursor, buildParams]);

  const loadMoreRef = useRef(handleLoadMore);

  useEffect(() => {
    loadMoreRef.current = handleLoadMore;
  });

  const handleRetry = useCallback(() => {
    setRetryCount((current) => current + 1);
  }, []);

  const handleRetryMore = useCallback(() => {
    loadMoreRef.current();
  }, []);

  return {
    listings,
    total,
    nextCursor,
    fetchStatus,
    loadMore: handleLoadMore,
    retry: handleRetry,
    retryMore: handleRetryMore,
  };
}
