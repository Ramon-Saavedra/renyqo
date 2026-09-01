"use client";

import { useCallback } from "react";
import { mapActiveApplicationsToCandidates } from "../api/map-active-application-to-candidate";
import {
  getProviderActiveApplications,
  getProviderWaitingCount,
} from "../api/provider-listing-applications";
import { useListingData } from "./useListingData";
import type {
  Candidate,
  DashboardObjectStatus,
  WaitingCountState,
} from "../types";

interface SelectedListingData {
  readonly candidates: readonly Candidate[];
  readonly waitingCountState: WaitingCountState;
}

interface SelectedListingApplicationsResult {
  readonly candidates: readonly Candidate[];
  readonly waitingCountState: WaitingCountState;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

const IDLE_STATE: SelectedListingData = {
  candidates: [],
  waitingCountState: { status: "idle" },
};

const LOADING_STATE: SelectedListingData = {
  candidates: [],
  waitingCountState: { status: "loading" },
};

export function useSelectedListingApplications(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): SelectedListingApplicationsResult {
  const load = useCallback(async (currentListingId: string) => {
    const [applicationsResult, waitingResult] = await Promise.allSettled([
      getProviderActiveApplications(currentListingId),
      getProviderWaitingCount(currentListingId),
    ]);

    const waitingCountState: WaitingCountState =
      waitingResult.status === "fulfilled"
        ? { status: "success", count: waitingResult.value }
        : { status: "error" };

    if (applicationsResult.status === "fulfilled") {
      return {
        data: {
          candidates: mapActiveApplicationsToCandidates(
            applicationsResult.value,
          ),
          waitingCountState,
        },
        hasError: false,
      };
    }

    return {
      data: { candidates: [], waitingCountState },
      hasError: true,
    };
  }, []);

  const { data, isLoading, hasError } = useListingData(
    listingId,
    listingStatus,
    IDLE_STATE,
    LOADING_STATE,
    load,
  );

  return {
    candidates: data.candidates,
    waitingCountState: data.waitingCountState,
    isLoading,
    hasError,
  };
}
