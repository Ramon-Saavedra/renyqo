"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardObjectStatus } from "../types";
import { useTabRefreshRevision } from "./TabRefreshProvider";

interface ListingDataState<T> {
  readonly listingId: string | null;
  readonly data: T;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

interface ListingDataResult<T> {
  readonly data: T;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

function resolveActiveListingId(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): string | null {
  if (!listingId || listingStatus === "draft") return null;
  return listingId;
}

export function useListingData<T>(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
  idleData: T,
  loadingData: T,
  load: (listingId: string) => Promise<{ data: T; hasError: boolean }>,
): ListingDataResult<T> {
  const activeListingId = resolveActiveListingId(listingId, listingStatus);
  const refreshRevision = useTabRefreshRevision();
  const previousActiveListingIdRef = useRef<string | null>(null);
  const previousRefreshRevisionRef = useRef(refreshRevision);
  const [prevActiveListingId, setPrevActiveListingId] =
    useState(activeListingId);
  const [state, setState] = useState<ListingDataState<T>>({
    listingId: null,
    data: idleData,
    isLoading: false,
    hasError: false,
  });

  useEffect(() => {
    const listingChanged =
      previousActiveListingIdRef.current !== activeListingId;
    const refreshRequested =
      previousRefreshRevisionRef.current !== refreshRevision;

    previousActiveListingIdRef.current = activeListingId;
    previousRefreshRevisionRef.current = refreshRevision;

    if (!activeListingId || (!listingChanged && !refreshRequested)) return;

    const currentListingId = activeListingId;
    const isRefresh = !listingChanged && refreshRequested;
    let active = true;

    async function loadListings() {
      if (!isRefresh) {
        setState({
          listingId: currentListingId,
          data: idleData,
          isLoading: true,
          hasError: false,
        });
      }

      try {
        const result = await load(currentListingId);
        if (!active) return;
        setState((current) => {
          if (current.listingId !== currentListingId) return current;
          if (isRefresh && result.hasError) {
            return { ...current, isLoading: false, hasError: true };
          }
          return {
            listingId: currentListingId,
            data: result.data,
            isLoading: false,
            hasError: result.hasError,
          };
        });
      } catch {
        if (!active) return;
        setState((current) => {
          if (current.listingId !== currentListingId) return current;
          if (isRefresh) {
            return { ...current, isLoading: false, hasError: true };
          }
          return {
            listingId: currentListingId,
            data: idleData,
            isLoading: false,
            hasError: true,
          };
        });
      }
    }

    void loadListings();

    return () => {
      active = false;
    };
  }, [activeListingId, refreshRevision, load, idleData]);

  if (activeListingId !== prevActiveListingId) {
    setPrevActiveListingId(activeListingId);
  }

  if (!activeListingId) {
    return { data: idleData, isLoading: false, hasError: false };
  }

  const resumedFromInactive =
    prevActiveListingId === null && state.listingId === activeListingId;

  if (
    state.listingId !== activeListingId ||
    resumedFromInactive ||
    state.isLoading
  ) {
    return { data: loadingData, isLoading: true, hasError: false };
  }

  return { data: state.data, isLoading: false, hasError: state.hasError };
}
