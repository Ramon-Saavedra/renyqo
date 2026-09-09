"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSavedListings } from "../api/saved-listings";
import type { PublicListing } from "../types";
import type { ListingsFetchStatus } from "./usePublicListings";

export interface UseSavedListingsResult {
  readonly listings: readonly PublicListing[];
  readonly total: number;
  readonly nextCursor: string | null;
  readonly fetchStatus: ListingsFetchStatus;
  readonly loadMore: () => void;
  readonly retry: () => void;
  readonly retryMore: () => void;
  readonly removeListing: (listingId: string) => void;
}

const PAGE_SIZE = 20;

function startFetch(generationRef: { current: number }): {
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

export function useSavedListings(): UseSavedListingsResult {
  const [listings, setListings] = useState<readonly PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] =
    useState<ListingsFetchStatus>("loading-page");
  const [retryCount, setRetryCount] = useState(0);
  const fetchGenerationRef = useRef(0);
  const paginationControllerRef = useRef<AbortController | null>(null);
  const listingsRef = useRef<readonly PublicListing[]>([]);

  useEffect(() => {
    const { controller, isStale } = startFetch(fetchGenerationRef);

    async function loadPage() {
      setFetchStatus("loading-page");

      try {
        const response = await getSavedListings(
          { limit: PAGE_SIZE },
          { signal: controller.signal },
        );

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
  }, [retryCount]);

  useEffect(() => {
    return () => {
      const controller = paginationControllerRef.current;
      if (controller === null) return;
      paginationControllerRef.current = null;
      fetchGenerationRef.current += 1;
      controller.abort();
    };
  }, []);

  const handleLoadMore = useCallback(() => {
    const cursor = nextCursor;
    if (cursor === null) return;

    paginationControllerRef.current?.abort();
    const { controller, isStale } = startFetch(fetchGenerationRef);
    paginationControllerRef.current = controller;

    async function append() {
      setFetchStatus("loading-more");

      try {
        const response = await getSavedListings(
          { limit: PAGE_SIZE, cursor: cursor ?? undefined },
          { signal: controller.signal },
        );

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
  }, [nextCursor]);

  const loadMoreRef = useRef(handleLoadMore);

  useEffect(() => {
    loadMoreRef.current = handleLoadMore;
  });

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    if (listings.length > 0) return;
    if (nextCursor === null) return;
    if (fetchStatus !== "idle") return;
    loadMoreRef.current();
  }, [listings.length, nextCursor, fetchStatus]);

  const handleRetry = useCallback(() => {
    setRetryCount((current) => current + 1);
  }, []);

  const handleRetryMore = useCallback(() => {
    loadMoreRef.current();
  }, []);

  const removeListing = useCallback((listingId: string) => {
    const current = listingsRef.current;
    if (!current.some((item) => item.id === listingId)) return;
    const next = current.filter((item) => item.id !== listingId);
    listingsRef.current = next;
    setListings(next);
    setTotal((total) => Math.max(0, total - 1));
  }, []);

  return {
    listings,
    total,
    nextCursor,
    fetchStatus,
    loadMore: handleLoadMore,
    retry: handleRetry,
    retryMore: handleRetryMore,
    removeListing,
  };
}
