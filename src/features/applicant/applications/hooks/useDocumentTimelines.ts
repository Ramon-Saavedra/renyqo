"use client";

import { useCallback } from "react";
import type { ApiRequestOptions } from "@/lib/api/client";
import {
  getDocumentRequestTimelines,
  type DocumentRequestTimeline,
} from "../api/documents";
import { useAuxiliaryLoad, type AuxiliaryLoad } from "./useAuxiliaryLoad";
import type { WorkspaceDocumentRequest } from "../api/workspace";

export function useDocumentTimelines(
  applicationId: string,
  snapshotKey: string,
  requests: readonly WorkspaceDocumentRequest[],
): AuxiliaryLoad<ReadonlyMap<string, DocumentRequestTimeline>> {
  const documentSnapshot = requests
    .map(({ requestId, documentId }) => JSON.stringify([requestId, documentId]))
    .sort();
  const loadKey = JSON.stringify([applicationId, snapshotKey, documentSnapshot]);
  const load = useCallback(
    (options: ApiRequestOptions) =>
      getDocumentRequestTimelines(applicationId, requests, options),
    [applicationId, requests],
  );
  return useAuxiliaryLoad(loadKey, requests.length > 0, load);
}
