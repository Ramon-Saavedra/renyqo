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

interface SelectedListingApplicationsResult {
  readonly candidates: readonly Candidate[];
  readonly waitingCountState: WaitingCountState;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

const IDLE_CANDIDATES: readonly Candidate[] = [];
const LOADING_CANDIDATES: readonly Candidate[] = [];
const IDLE_WAITING: WaitingCountState = { status: "idle" };
const LOADING_WAITING: WaitingCountState = { status: "loading" };

export function useSelectedListingApplications(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): SelectedListingApplicationsResult {
  const loadApplications = useCallback(async (currentListingId: string) => {
    try {
      const applications =
        await getProviderActiveApplications(currentListingId);
      return {
        data: mapActiveApplicationsToCandidates(applications),
        hasError: false,
      };
    } catch {
      return { data: IDLE_CANDIDATES, hasError: true };
    }
  }, []);

  const loadWaitingCount = useCallback(
    async (
      currentListingId: string,
    ): Promise<{ data: WaitingCountState; hasError: boolean }> => {
      try {
        const count = await getProviderWaitingCount(currentListingId);
        return { data: { status: "success", count }, hasError: false };
      } catch {
        return { data: { status: "error" }, hasError: false };
      }
    },
    [],
  );

  const candidatesResult = useListingData(
    listingId,
    listingStatus,
    IDLE_CANDIDATES,
    LOADING_CANDIDATES,
    loadApplications,
  );

  const waitingResult = useListingData(
    listingId,
    listingStatus,
    IDLE_WAITING,
    LOADING_WAITING,
    loadWaitingCount,
  );

  return {
    candidates: candidatesResult.data,
    waitingCountState: waitingResult.data,
    isLoading: candidatesResult.isLoading || waitingResult.isLoading,
    hasError: candidatesResult.hasError,
  };
}
