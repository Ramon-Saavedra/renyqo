"use client";

import { useCallback } from "react";
import { mapExitedApplicationsToExits } from "../api/map-exited-application-to-exit";
import { getProviderExitedApplications } from "../api/provider-exited-applications";
import {
  useCandidateRestoration,
  type CandidateRestorationState,
} from "./useCandidateRestoration";
import { useListingData } from "./useListingData";
import { useRequestTabRefresh } from "./TabRefreshProvider";
import type { DashboardObjectStatus, ExitedApplicant } from "../types";

interface ExitedData {
  readonly exits: readonly ExitedApplicant[];
  readonly totalCount: number;
}

interface UseExitedApplicationsResult {
  readonly exits: readonly ExitedApplicant[];
  readonly totalCount: number;
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly restorationState: CandidateRestorationState;
  readonly restoreCandidate: (applicationId: string) => Promise<boolean>;
  readonly resetRestoration: () => void;
}

const IDLE_DATA: ExitedData = {
  exits: [],
  totalCount: 0,
};

export function useExitedApplications(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): UseExitedApplicationsResult {
  const requestRefresh = useRequestTabRefresh();
  const {
    state: restorationState,
    restoreCandidate: submitRestoration,
    reset: resetRestoration,
  } = useCandidateRestoration();
  const load = useCallback(async (currentListingId: string) => {
    const response = await getProviderExitedApplications(currentListingId);
    return {
      data: {
        exits: mapExitedApplicationsToExits(response.items),
        totalCount: response.totalCount,
      },
      hasError: false,
    };
  }, []);

  const { data, isLoading, hasError, updateData } = useListingData(
    listingId,
    listingStatus,
    IDLE_DATA,
    IDLE_DATA,
    load,
  );

  const restoreCandidate = useCallback(
    async (applicationId: string): Promise<boolean> => {
      const restored = await submitRestoration(applicationId);
      if (!restored) return false;

      updateData((current) => {
        if (!current.exits.some((exit) => exit.id === applicationId)) {
          return current;
        }

        return {
          exits: current.exits.filter((exit) => exit.id !== applicationId),
          totalCount: Math.max(0, current.totalCount - 1),
        };
      });
      requestRefresh();
      return true;
    },
    [requestRefresh, submitRestoration, updateData],
  );

  return {
    exits: data.exits,
    totalCount: data.totalCount,
    isLoading,
    hasError,
    restorationState,
    restoreCandidate,
    resetRestoration,
  };
}
