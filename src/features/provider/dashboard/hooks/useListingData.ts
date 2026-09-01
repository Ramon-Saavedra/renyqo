"use client";

import { useEffect, useState } from "react";
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
  const [prevActiveListingId, setPrevActiveListingId] =
    useState(activeListingId);
  const [state, setState] = useState<ListingDataState<T>>({
    listingId: null,
    data: idleData,
    isLoading: false,
    hasError: false,
  });

  useEffect(() => {
    if (!activeListingId) return;

    const currentListingId = activeListingId;
    let active = true;

    async function loadListings() {
      setState({
        listingId: currentListingId,
        data: idleData,
        isLoading: true,
        hasError: false,
      });

      try {
        const result = await load(currentListingId);
        if (!active) return;
        setState({
          listingId: currentListingId,
          data: result.data,
          isLoading: false,
          hasError: result.hasError,
        });
      } catch {
        if (!active) return;
        setState({
          listingId: currentListingId,
          data: idleData,
          isLoading: false,
          hasError: true,
        });
      }
    }

    void loadListings();

    return () => {
      active = false;
    };
  }, [activeListingId, load, idleData]);

  useEffect(() => {
    if (!activeListingId || refreshRevision === 0) return;

    const currentListingId = activeListingId;
    let active = true;

    async function refreshListings() {
      try {
        const result = await load(currentListingId);
        if (!active) return;
        setState((current) =>
          current.listingId === currentListingId
            ? {
                listingId: currentListingId,
                data: result.data,
                isLoading: false,
                hasError: result.hasError,
              }
            : current,
        );
      } catch {
        if (!active) return;
        setState((current) =>
          current.listingId === currentListingId
            ? { ...current, hasError: true }
            : current,
        );
      }
    }

    void refreshListings();

    return () => {
      active = false;
    };
  }, [activeListingId, refreshRevision, load]);

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
