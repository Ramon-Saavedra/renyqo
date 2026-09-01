"use client";

import { useCallback } from "react";
import { mapExitedApplicationsToExits } from "../api/map-exited-application-to-exit";
import { getProviderExitedApplications } from "../api/provider-exited-applications";
import { useListingData } from "./useListingData";
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
}

const IDLE_DATA: ExitedData = {
  exits: [],
  totalCount: 0,
};

export function useExitedApplications(
  listingId: string | null,
  listingStatus: DashboardObjectStatus | null,
): UseExitedApplicationsResult {
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

  const { data, isLoading, hasError } = useListingData(
    listingId,
    listingStatus,
    IDLE_DATA,
    IDLE_DATA,
    load,
  );

  return {
    exits: data.exits,
    totalCount: data.totalCount,
    isLoading,
    hasError,
  };
}
