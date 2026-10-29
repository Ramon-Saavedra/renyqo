import { subscribeConversationAttention } from "@/lib/realtime/attention";
import type { AttentionNotice } from "@/lib/realtime/attention";
import {
  invalidateViewingSnapshotsForListing,
  refetchViewingSnapshot,
  registerViewingSnapshotResetHook,
  subscribedApplicationIds,
  subscribeViewingSnapshot as subscribeStore,
} from "./owner";

let bound = false;
let unsubscribeAttention: (() => void) | null = null;

function refreshSubscribed(): void {
  for (const applicationId of subscribedApplicationIds()) {
    void refetchViewingSnapshot(applicationId);
  }
}

function onFocus(): void {
  if (document.visibilityState !== "visible") return;
  refreshSubscribed();
}

function onAttention(notice: AttentionNotice): void {
  if (notice.refreshAllSummaries) refreshSubscribed();
  else {
    for (const applicationId of notice.viewingApplicationIds) {
      if (subscribedApplicationIds().includes(applicationId)) {
        void refetchViewingSnapshot(applicationId);
      }
    }
  }
  for (const listingId of notice.listingIds) {
    invalidateViewingSnapshotsForListing(listingId);
  }
}

export function unbindViewingSnapshotSession(): void {
  if (!bound) return;
  bound = false;
  if (typeof window === "undefined") return;
  window.removeEventListener("focus", onFocus);
  document.removeEventListener("visibilitychange", onFocus);
  unsubscribeAttention?.();
  unsubscribeAttention = null;
}

function bindViewingSnapshotSession(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onFocus);
  unsubscribeAttention = subscribeConversationAttention(onAttention);
}

registerViewingSnapshotResetHook(unbindViewingSnapshotSession);

export function subscribeViewingSnapshotSession(
  applicationId: string,
  listener: () => void,
): () => void {
  bindViewingSnapshotSession();
  const unsubscribe = subscribeStore(applicationId, listener);
  return () => {
    unsubscribe();
    if (subscribedApplicationIds().length === 0) unbindViewingSnapshotSession();
  };
}
