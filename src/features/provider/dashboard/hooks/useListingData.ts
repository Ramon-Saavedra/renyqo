"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  readonly updateData: (update: (current: T) => T) => void;
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
  const loadedListingIdRef = useRef<string | null>(null);
  const stateListingIdRef = useRef<string | null>(null);
  const requestIdsRef = useRef(new Map<string, number>());
  const [prevActiveListingId, setPrevActiveListingId] =
    useState(activeListingId);
  const [state, setState] = useState<ListingDataState<T>>({
    listingId: null,
    data: idleData,
    isLoading: false,
    hasError: false,
  });

  const updateData = useCallback(
    (update: (current: T) => T) => {
      if (!activeListingId) return;
      const requestId = (requestIdsRef.current.get(activeListingId) ?? 0) + 1;
      requestIdsRef.current.set(activeListingId, requestId);
      setState((current) => {
        if (current.listingId !== activeListingId) return current;
        return { ...current, data: update(current.data) };
      });
    },
    [activeListingId],
  );

  useEffect(() => {
    if (!activeListingId) {
      loadedListingIdRef.current = null;
      stateListingIdRef.current = null;
      return;
    }

    const currentListingId = activeListingId;
    const isRefresh =
      loadedListingIdRef.current === currentListingId &&
      stateListingIdRef.current === currentListingId;
    const requestId = (requestIdsRef.current.get(currentListingId) ?? 0) + 1;
    requestIdsRef.current.set(currentListingId, requestId);
    let active = true;

    async function loadListings() {
      if (!isRefresh) {
        stateListingIdRef.current = currentListingId;
        setState({
          listingId: currentListingId,
          data: idleData,
          isLoading: true,
          hasError: false,
        });
      }

      try {
        const result = await load(currentListingId);
        if (
          !active ||
          requestId !== requestIdsRef.current.get(currentListingId)
        )
          return;
        loadedListingIdRef.current = currentListingId;
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
        if (
          !active ||
          requestId !== requestIdsRef.current.get(currentListingId)
        )
          return;
        loadedListingIdRef.current = currentListingId;
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
    return { data: idleData, isLoading: false, hasError: false, updateData };
  }

  const resumedFromInactive =
    prevActiveListingId === null && state.listingId === activeListingId;

  if (
    state.listingId !== activeListingId ||
    resumedFromInactive ||
    state.isLoading
  ) {
    return { data: loadingData, isLoading: true, hasError: false, updateData };
  }

  return {
    data: state.data,
    isLoading: false,
    hasError: state.hasError,
    updateData,
  };
}
