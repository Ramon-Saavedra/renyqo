"use client";
import { useOptionalProviderWorkspace } from "@/features/provider/workspaces/scope-context";

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
  const scopedOwner = useOptionalProviderWorkspace()?.viewingOwner;
  const owner = side === "provider" ? scopedOwner : undefined;
  const subscribe = useCallback(
    (listener: () => void) =>
      owner
        ? owner.subscribeViewingSnapshot(applicationId, listener)
        : subscribeViewingSnapshotSession(applicationId, listener),
    [applicationId, owner],
  );
  const state = useSyncExternalStore(
    subscribe,
    () =>
      owner
        ? owner.getViewingSnapshotState(applicationId)
        : getViewingSnapshotState(applicationId),
    () => getViewingSnapshotState(applicationId),
  );

  useEffect(() => {
    void (owner
      ? owner.ensureViewingSnapshot(applicationId, side)
      : ensureViewingSnapshot(applicationId, side));
  }, [applicationId, side, owner]);

  useEffect(() => {
    if (!owner) return;
    const refresh = () => {
      if (document.visibilityState === "visible")
        void owner.refetchViewingSnapshot(applicationId, side);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [owner, applicationId, side]);
  return state;
}
