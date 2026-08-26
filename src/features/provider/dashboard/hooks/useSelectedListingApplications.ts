"use client";

import { useEffect, useState } from "react";
import { mapActiveApplicationsToCandidates } from "../api/map-active-application-to-candidate";
import {
  getProviderActiveApplications,
  getProviderWaitingCount,
} from "../api/provider-listing-applications";
import type {
  Candidate,
  DashboardObjectStatus,
  WaitingCountState,
} from "../types";

interface SelectedListingApplicationsState {
  readonly listingId: string | null;
  readonly candidates: readonly Candidate[];
  readonly waitingCountState: WaitingCountState;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

interface SelectedListingApplicationsResult {
  readonly candidates: readonly Candidate[];
  readonly waitingCountState: WaitingCountState;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

const IDLE_STATE: SelectedListingApplicationsResult = {
  candidates: [],
  waitingCountState: { status: "idle" },
  isLoading: false,
  hasError: false,
};

const LOADING_STATE: SelectedListingApplicationsResult = {
  candidates: [],
  waitingCountState: { status: "loading" },
  isLoading: true,
  hasError: false,
};

function resolveActiveListingId(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): string | null {
  if (!listingId || listingStatus === "draft") return null;
  return listingId;
}

export function useSelectedListingApplications(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): SelectedListingApplicationsResult {
  const activeListingId = resolveActiveListingId(listingId, listingStatus);
  const [prevActiveListingId, setPrevActiveListingId] =
    useState(activeListingId);
  const [state, setState] = useState<SelectedListingApplicationsState>({
    listingId: null,
    candidates: [],
    waitingCountState: { status: "idle" },
    isLoading: false,
    hasError: false,
  });

  useEffect(() => {
    if (!activeListingId) return;

    const currentListingId = activeListingId;
    let active = true;

    async function loadApplications() {
      setState({
        listingId: currentListingId,
        candidates: [],
        waitingCountState: { status: "loading" },
        isLoading: true,
        hasError: false,
      });

      try {
        const [applicationsResult, waitingResult] = await Promise.allSettled([
          getProviderActiveApplications(currentListingId),
          getProviderWaitingCount(currentListingId),
        ]);
        if (!active) return;

        const waitingCountState: WaitingCountState =
          waitingResult.status === "fulfilled"
            ? { status: "success", count: waitingResult.value }
            : { status: "error" };

        if (applicationsResult.status === "fulfilled") {
          setState({
            listingId: currentListingId,
            candidates: mapActiveApplicationsToCandidates(
              applicationsResult.value,
            ),
            waitingCountState,
            isLoading: false,
            hasError: false,
          });
          return;
        }

        setState({
          listingId: currentListingId,
          candidates: [],
          waitingCountState,
          isLoading: false,
          hasError: true,
        });
      } catch {
        if (!active) return;
        setState({
          listingId: currentListingId,
          candidates: [],
          waitingCountState: { status: "error" },
          isLoading: false,
          hasError: true,
        });
      }
    }

    void loadApplications();

    return () => {
      active = false;
    };
  }, [activeListingId]);

  if (activeListingId !== prevActiveListingId) {
    setPrevActiveListingId(activeListingId);
  }

  if (!activeListingId) {
    return IDLE_STATE;
  }

  const resumedFromInactive =
    prevActiveListingId === null && state.listingId === activeListingId;

  if (
    state.listingId !== activeListingId ||
    resumedFromInactive ||
    state.isLoading
  ) {
    return LOADING_STATE;
  }

  return {
    candidates: state.candidates,
    waitingCountState: state.waitingCountState,
    isLoading: state.isLoading,
    hasError: state.hasError,
  };
}
