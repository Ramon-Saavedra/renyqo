"use client";
import { useOptionalProviderWorkspace } from "@/features/provider/workspaces/scope-context";
import type { ApiRequestOptions } from "@/lib/api/client";

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
  string,
  {
    role: GlobalAttentionRole;
    options: ApiRequestOptions | undefined;
    snapshot: GlobalAttentionSnapshot;
    listeners: Set<() => void>;
    load: Promise<void> | null;
    fetchGeneration: number;
    subscribers: number;
    poll: number | null;
  }
>();

function getStore(role: string, options?: ApiRequestOptions) {
  let store = stores.get(role);
  if (!store) {
    store = {
      role: role === "applicant" ? "applicant" : "provider",
      options,
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

function notify(role: string): void {
  const store = getStore(role);
  for (const listener of store.listeners) listener();
}

function publish(role: string, snapshot: GlobalAttentionSnapshot): void {
  const store = getStore(role);
  store.snapshot = snapshot;
  notify(role);
}

async function loadAttention(role: string, append = false): Promise<void> {
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
      const page = await getAttentionAggregate(
        store.role,
        {
          filter: "actionable",
          limit: 20,
          offset: previous
            ? previous.pagination.offset + previous.pagination.limit
            : 0,
        },
        store.options,
      );
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
  for (const [key, store] of stores) {
    if (role && store.role !== role) continue;
    if (store.listeners.size === 0) {
      store.fetchGeneration += 1;
      store.load = null;
      publish(key, emptySnapshot);
      continue;
    }
    store.load = null;
    void loadAttention(key);
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

function refreshAttention(key: string): void {
  getStore(key).load = null;
  void loadAttention(key);
}

export function useGlobalAttention(role: GlobalAttentionRole) {
  const scope = useOptionalProviderWorkspace();
  const key = role === "provider" && scope ? "provider:" + scope.key : role;
  const store = getStore(
    key,
    role === "provider" ? scope?.requestOptions : undefined,
  );

  const snapshot = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.snapshot,
    () => emptySnapshot,
  );

  const refetch = useCallback(() => {
    refreshAttention(key);
  }, [key]);

  useEffect(() => {
    const current = getStore(key);
    current.subscribers += 1;
    if (current.subscribers === 1) {
      void loadAttention(key);
      // Quiet applications can acquire time-based actions outside the filtered result.
      current.poll = window.setInterval(() => {
        refreshAttention(key);
      }, 60_000);
    }
    return () => {
      current.subscribers -= 1;
      if (current.subscribers === 0 && current.poll !== null) {
        window.clearInterval(current.poll);
        current.poll = null;
      }
      if (current.subscribers === 0 && key.startsWith("provider:")) {
        current.fetchGeneration += 1;
        current.load = null;
        current.snapshot = emptySnapshot;
        queueMicrotask(() => {
          if (current.subscribers === 0 && stores.get(key) === current)
            stores.delete(key);
        });
      }
    };
  }, [key]);

  const loadMore = useCallback(() => {
    void loadAttention(key, true);
  }, [key]);

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
