"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getAttentionAggregate } from "../api/get-attention-aggregate";
import {
  groupGlobalAttentionItems,
  groupGlobalMessageItems,
  type GlobalAttentionRole,
} from "../global-attention";
import type { AttentionAggregateResponse } from "../types";
import { useAttentionRevalidate } from "../use-attention-revalidate";

type GlobalAttentionSnapshot = {
  readonly data: AttentionAggregateResponse | null;
  readonly loading: boolean;
  readonly error: boolean;
  readonly loadingMore: boolean;
  readonly loadMoreError: boolean;
};

const emptySnapshot: GlobalAttentionSnapshot = {
  data: null,
  loading: false,
  error: false,
  loadingMore: false,
  loadMoreError: false,
};

const stores = new Map<
  GlobalAttentionRole,
  {
    snapshot: GlobalAttentionSnapshot;
    listeners: Set<() => void>;
    load: Promise<void> | null;
    fetchGeneration: number;
    subscribers: number;
    poll: number | null;
  }
>();

function getStore(role: GlobalAttentionRole) {
  let store = stores.get(role);
  if (!store) {
    store = {
      snapshot: emptySnapshot,
      listeners: new Set(),
      load: null,
      fetchGeneration: 0,
      subscribers: 0,
      poll: null,
    };
    stores.set(role, store);
  }
  return store;
}

function notify(role: GlobalAttentionRole): void {
  const store = getStore(role);
  for (const listener of store.listeners) listener();
}

function publish(
  role: GlobalAttentionRole,
  snapshot: GlobalAttentionSnapshot,
): void {
  const store = getStore(role);
  store.snapshot = snapshot;
  notify(role);
}

async function loadAttention(
  role: GlobalAttentionRole,
  append = false,
): Promise<void> {
  const store = getStore(role);
  if (store.load) return store.load;
  const previous = append ? store.snapshot.data : null;
  if (append && !previous?.pagination.hasMore) return;

  const generation = ++store.fetchGeneration;
  publish(role, {
    data: store.snapshot.data,
    loading: !append,
    error: false,
    loadingMore: append,
    loadMoreError: false,
  });
  store.load = (async () => {
    try {
      const page = await getAttentionAggregate(role, {
        filter: "actionable",
        limit: 20,
        offset: previous
          ? previous.pagination.offset + previous.pagination.limit
          : 0,
      });
      if (store.fetchGeneration !== generation) return;
      const data = previous
        ? {
            ...page,
            items: Array.from(
              new Map(
                [...previous.items, ...page.items].map((item) => [
                  item.applicationId,
                  item,
                ]),
              ).values(),
            ),
          }
        : page;
      publish(role, {
        data,
        loading: false,
        error: false,
        loadingMore: false,
        loadMoreError: false,
      });
    } catch {
      if (store.fetchGeneration !== generation) return;
      publish(role, {
        data: previous,
        loading: false,
        error: !append,
        loadingMore: false,
        loadMoreError: append,
      });
    } finally {
      if (store.fetchGeneration === generation) {
        store.load = null;
      }
    }
  })();

  return store.load;
}

export function invalidateGlobalAttention(role?: GlobalAttentionRole): void {
  const roles = role ? [role] : (["applicant", "provider"] as const);
  for (const entry of roles) {
    const store = getStore(entry);
    if (store.listeners.size === 0) {
      store.fetchGeneration += 1;
      store.load = null;
      publish(entry, emptySnapshot);
      continue;
    }
    store.load = null;
    void loadAttention(entry);
  }
}

/** Discard cached notices and pending responses when signing out. */
export function clearGlobalAttention(): void {
  for (const [role, store] of stores) {
    store.fetchGeneration += 1;
    store.load = null;
    publish(role, emptySnapshot);
  }
}

export function useGlobalAttention(role: GlobalAttentionRole) {
  const store = getStore(role);

  const snapshot = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.snapshot,
    () => emptySnapshot,
  );

  const refetch = useCallback(() => {
    invalidateGlobalAttention(role);
  }, [role]);

  useEffect(() => {
    const current = getStore(role);
    current.subscribers += 1;
    if (current.subscribers === 1) {
      void loadAttention(role);
      // Quiet applications can acquire time-based actions outside the filtered result.
      current.poll = window.setInterval(() => {
        invalidateGlobalAttention(role);
      }, 60_000);
    }
    return () => {
      current.subscribers -= 1;
      if (current.subscribers === 0 && current.poll !== null) {
        window.clearInterval(current.poll);
        current.poll = null;
      }
    };
  }, [role]);

  const loadMore = useCallback(() => {
    void loadAttention(role, true);
  }, [role]);

  useAttentionRevalidate(
    snapshot.data?.totals.nextRevalidateAt ?? null,
    refetch,
  );

  const items = snapshot.data?.items;
  const attentionGroups = items ? groupGlobalAttentionItems(items, role) : [];
  const messageGroups = items ? groupGlobalMessageItems(items, role) : [];

  return {
    loading: snapshot.loading,
    error: snapshot.error,
    attentionCount: snapshot.data?.totals.applicationsWithPendingActions ?? 0,
    messageCount: snapshot.data?.totals.actionableUnreadMessageCount ?? 0,
    attentionGroups,
    messageGroups,
    hasMore: snapshot.data?.pagination.hasMore ?? false,
    loadMore,
    loadingMore: snapshot.loadingMore,
    loadMoreError: snapshot.loadMoreError,
    refetch,
  };
}
