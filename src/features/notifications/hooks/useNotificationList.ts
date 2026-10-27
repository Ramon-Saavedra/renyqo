"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeConversationAttention } from "@/lib/realtime/attention";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import type { NotificationCategory, NotificationItem } from "../api/schema";

const PAGE_SIZE = 25;

interface NotificationCursor {
  readonly beforeCreatedAt: string;
  readonly beforeId: string;
}

export function useNotificationList(
  enabled: boolean,
  category: NotificationCategory | null,
) {
  const [items, setItems] = useState<readonly NotificationItem[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [cursor, setCursor] = useState<NotificationCursor | null>(null);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "ready" | "error"
  >("idle");
  const [settledCategory, setSettledCategory] = useState<
    NotificationCategory | null | undefined
  >(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const generation = useRef(0);
  const loadGeneration = useRef(0);

  const status =
    settledCategory !== category
      ? "loading"
      : requestStatus === "error"
        ? "error"
        : requestStatus === "ready"
          ? "ready"
          : "loading";

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    return subscribeConversationAttention((notice) => {
      if (notice.refreshNotifications) reload();
    });
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return;
    const requestId = generation.current + 1;
    generation.current = requestId;
    const requestedCategory = category;
    listNotifications({
      limit: PAGE_SIZE,
      ...(category ? { category } : {}),
    })
      .then((page) => {
        if (generation.current !== requestId) return;
        setItems(page.items);
        setAsOf(page.asOf);
        setCursor(page.nextCursor);
        setSettledCategory(requestedCategory);
        setRequestStatus("ready");
        setMoreError(false);
      })
      .catch(() => {
        if (generation.current !== requestId) return;
        setSettledCategory(requestedCategory);
        setRequestStatus("error");
      });
  }, [category, enabled, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    const requestId = generation.current;
    const loadId = loadGeneration.current + 1;
    loadGeneration.current = loadId;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await listNotifications({
        limit: PAGE_SIZE,
        ...(category ? { category } : {}),
        beforeCreatedAt: cursor.beforeCreatedAt,
        beforeId: cursor.beforeId,
      });
      if (
        generation.current !== requestId ||
        loadGeneration.current !== loadId
      ) {
        return;
      }
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      if (
        generation.current === requestId &&
        loadGeneration.current === loadId
      ) {
        setMoreError(true);
      }
    } finally {
      if (loadGeneration.current === loadId) setLoadingMore(false);
    }
  }, [category, cursor, loadingMore]);

  const markOne = useCallback(
    async (notificationId: string) => {
      setActionError(false);
      try {
        await markNotificationRead(notificationId);
      } catch {
        setActionError(true);
      }
      reload();
    },
    [reload],
  );

  const markAll = useCallback(async () => {
    if (!asOf) return;
    setActionError(false);
    try {
      await markAllNotificationsRead(asOf);
    } catch {
      setActionError(true);
    }
    reload();
  }, [asOf, reload]);

  return {
    items,
    asOf,
    hasMore: cursor !== null && status === "ready",
    status,
    loadingMore,
    moreError,
    actionError,
    reload,
    loadMore,
    markOne,
    markAll,
  };
}
