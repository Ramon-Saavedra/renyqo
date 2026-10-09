"use client";

import { useCallback } from "react";
import type { ApiRequestOptions } from "@/lib/api/client";
import { getViewingDetail, type ViewingDetail } from "../api/viewings";
import { useAuxiliaryLoad, type AuxiliaryLoad } from "./useAuxiliaryLoad";

export function useViewingDetail(
  applicationId: string,
  viewingId: string | null,
  snapshotKey: string,
): AuxiliaryLoad<ViewingDetail | null> {
  const load = useCallback(
    (options: ApiRequestOptions) =>
      viewingId
        ? getViewingDetail(applicationId, viewingId, options)
        : Promise.resolve(null),
    [applicationId, viewingId],
  );
  return useAuxiliaryLoad(
    `${applicationId}:${viewingId}:${snapshotKey}`,
    viewingId !== null,
    load,
  );
}
