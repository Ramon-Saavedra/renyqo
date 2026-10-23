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
}

type AttentionListener = (notice: AttentionNotice) => void;

interface PendingFlush {
  role: GlobalAttentionRole;
  refreshLists: boolean;
  refreshAllSummaries: boolean;
  summaryIds: Set<string>;
  catchUpAll: boolean;
  catchUpIds: Set<string>;
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
  next.summaryIds.clear();
  next.catchUpAll = true;
  next.catchUpIds.clear();
  arm();
}

export function resetRealtimeSchedules(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  pending = null;
}
