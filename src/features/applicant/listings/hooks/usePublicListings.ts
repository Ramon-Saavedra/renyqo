"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicListings } from "../api/public-listings";
import type {
  ListingFilters,
  PublicListing,
  PublicListingsParams,
  SortKey,
} from "../types";
import { clampListingsSearchQuery } from "../utils/listings-search-params";

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

function isTypingQueryChange(from: string, to: string): boolean {
  if (from === to || to.length === 0) return false;
  if (Math.abs(from.length - to.length) !== 1) return false;
  const shorter = from.length < to.length ? from : to;
  const longer = from.length < to.length ? to : from;
  return longer.startsWith(shorter);
}

function listingFetchSignature(
  filters: ListingFilters,
  sort: SortKey,
  hasProfile: boolean,
): string {
  return [
    filters.maxColdRent,
    filters.minRooms,
    filters.minLivingArea,
    filters.availableFrom,
    filters.onlyMatching,
    sort,
    hasProfile,
  ].join("\0");
}

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
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const [retryCount, setRetryCount] = useState(0);
  const [queryTrail, setQueryTrail] = useState({
    previous: filters.query,
    current: filters.query,
  });
  const [seenSignature, setSeenSignature] = useState(
    listingFetchSignature(filters, sort, hasProfile),
  );

  const fetchGenerationRef = useRef(0);

  const fetchSignature = listingFetchSignature(filters, sort, hasProfile);
  const othersChanged = fetchSignature !== seenSignature;
  const previousQuery =
    queryTrail.current === filters.query
      ? queryTrail.previous
      : queryTrail.current;
  const typingQuery = isTypingQueryChange(previousQuery, filters.query);

  if (queryTrail.current !== filters.query) {
    setQueryTrail({ previous: queryTrail.current, current: filters.query });
  }
  if (seenSignature !== fetchSignature) {
    setSeenSignature(fetchSignature);
  }
  if (debouncedQuery !== filters.query && (!typingQuery || othersChanged)) {
    setDebouncedQuery(filters.query);
  }

  useEffect(() => {
    if (filters.query === debouncedQuery) return undefined;
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, QUERY_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [filters.query, debouncedQuery]);

  // Build API params from current state.
  const buildParams = useCallback(
    (cursor?: string | null): PublicListingsParams => ({
      query: clampListingsSearchQuery(debouncedQuery) || undefined,
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
