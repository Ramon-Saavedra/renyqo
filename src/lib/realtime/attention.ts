import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { normalizeRole } from "@/lib/normalize-role";
import {
  catchUpAllOpenConversations,
  catchUpOpenConversation,
} from "./open-conversations";

export const REALTIME_COALESCE_MS = 250;

export interface AttentionNotice {
  readonly refreshLists: boolean;
  readonly refreshAllSummaries: boolean;
  readonly summaryApplicationIds: readonly string[];
  readonly viewingApplicationIds: readonly string[];
  readonly listingIds: readonly string[];
  readonly refreshNotifications: boolean;
}

type AttentionListener = (notice: AttentionNotice) => void;

interface PendingFlush {
  role: GlobalAttentionRole;
  refreshLists: boolean;
  refreshAllSummaries: boolean;
  summaryIds: Set<string>;
  catchUpAll: boolean;
  catchUpIds: Set<string>;
  viewingIds: Set<string>;
  listingIds: Set<string>;
  refreshNotifications: boolean;
}

const listeners = new Set<AttentionListener>();
let pending: PendingFlush | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function resolveAttentionRole(role: string): GlobalAttentionRole | null {
  return normalizeRole(role);
}

function ensurePending(role: GlobalAttentionRole): PendingFlush {
  if (!pending) {
    pending = {
      role,
      refreshLists: false,
      refreshAllSummaries: false,
      summaryIds: new Set(),
      catchUpAll: false,
      catchUpIds: new Set(),
      viewingIds: new Set(),
      listingIds: new Set(),
      refreshNotifications: false,
    };
  }
  pending.role = role;
  return pending;
}

function arm(): void {
  if (timer !== null) return;
  timer = setTimeout(flush, REALTIME_COALESCE_MS);
}

function flush(): void {
  timer = null;
  const current = pending;
  pending = null;
  if (!current) return;

  if (current.refreshLists) invalidateGlobalAttention(current.role);
  const notice: AttentionNotice = {
    refreshLists: current.refreshLists,
    refreshAllSummaries: current.refreshAllSummaries,
    summaryApplicationIds: [...current.summaryIds],
    viewingApplicationIds: [...current.viewingIds],
    listingIds: [...current.listingIds],
    refreshNotifications: current.refreshNotifications,
  };
  for (const listener of [...listeners]) {
    try {
      listener(notice);
    } catch {
      // One mounted view must not block the other refreshes.
    }
  }
  if (current.catchUpAll) {
    catchUpAllOpenConversations();
    return;
  }
  for (const applicationId of current.catchUpIds) {
    catchUpOpenConversation(applicationId);
  }
}

export function subscribeConversationAttention(
  listener: AttentionListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function scheduleConversationMessage(
  role: string,
  applicationId: string,
): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  if (
    next.refreshAllSummaries ||
    next.catchUpAll ||
    next.summaryIds.has(applicationId)
  ) {
    arm();
    return;
  }
  next.catchUpIds.add(applicationId);
  arm();
}

export function scheduleConversationSummary(
  role: string,
  applicationId: string,
): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  next.catchUpIds.delete(applicationId);
  if (!next.refreshAllSummaries) next.summaryIds.add(applicationId);
  arm();
}

export function scheduleRealtimeResync(role: string): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  next.refreshAllSummaries = true;
  next.refreshNotifications = true;
  next.summaryIds.clear();
  next.catchUpAll = true;
  next.catchUpIds.clear();
  arm();
}

export function scheduleViewingChanged(
  role: string,
  applicationId: string,
  listingId: string,
): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved || listingId.length === 0) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  next.refreshNotifications = true;
  next.viewingIds.add(applicationId);
  if (!next.refreshAllSummaries) next.summaryIds.add(applicationId);
  arm();
}

export function scheduleLifecycleChanged(
  role: string,
  applicationId: string,
  listingId: string,
): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  next.refreshNotifications = true;
  next.viewingIds.add(applicationId);
  next.listingIds.add(listingId);
  if (!next.refreshAllSummaries) next.summaryIds.add(applicationId);
  if (!next.catchUpAll) next.catchUpIds.add(applicationId);
  arm();
}

export function scheduleListingApplicationsChanged(
  role: string,
  listingId: string,
): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshLists = true;
  next.refreshNotifications = true;
  next.listingIds.add(listingId);
  arm();
}

export function scheduleNotificationsChanged(role: string): void {
  const resolved = resolveAttentionRole(role);
  if (!resolved) return;
  const next = ensurePending(resolved);
  next.refreshNotifications = true;
  arm();
}

export function noticeRefreshesApplication(
  notice: AttentionNotice,
  applicationId: string,
  listingId: string | null,
): boolean {
  if (notice.refreshAllSummaries) return true;
  if (
    notice.summaryApplicationIds.includes(applicationId) ||
    notice.viewingApplicationIds.includes(applicationId)
  ) {
    return true;
  }
  if (notice.listingIds.length === 0) return false;
  return listingId === null || notice.listingIds.includes(listingId);
}

export function resetRealtimeSchedules(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  pending = null;
}
