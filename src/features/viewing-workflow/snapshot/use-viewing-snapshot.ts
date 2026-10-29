"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  ensureViewingSnapshot,
  getViewingSnapshotState,
  type ViewingSide,
  type ViewingSnapshotState,
} from "./owner";
import { subscribeViewingSnapshotSession } from "./session-refresh";

export function useViewingSnapshot(
  applicationId: string,
  side: ViewingSide,
): ViewingSnapshotState {
  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeViewingSnapshotSession(applicationId, listener),
    [applicationId],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => getViewingSnapshotState(applicationId),
    () => getViewingSnapshotState(applicationId),
  );

  useEffect(() => {
    void ensureViewingSnapshot(applicationId, side);
  }, [applicationId, side]);

  return state;
}
