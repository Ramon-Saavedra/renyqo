"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeConversationAttention } from "@/lib/realtime/attention";
import { getNotificationUnreadCount } from "../api/notifications";

export function useNotificationUnreadCount() {
  const [count, setCount] = useState<number | null>(null);
  const generation = useRef(0);
  const active = useRef(false);

  const refresh = useCallback((): Promise<void> => {
    if (!active.current) return Promise.resolve();
    const requestId = ++generation.current;
    return getNotificationUnreadCount()
      .then((result) => {
        if (active.current && generation.current === requestId) {
          setCount(result.unreadCount);
        }
      })
      .catch(() => {
        // A failed refresh keeps the last count from the unread endpoint.
      });
  }, []);

  useEffect(() => {
    active.current = true;
    void refresh();
    const unsubscribe = subscribeConversationAttention((notice) => {
      if (notice.refreshNotifications) void refresh();
    });
    return () => {
      active.current = false;
      generation.current += 1;
      unsubscribe();
    };
  }, [refresh]);

  return { count, refresh };
}
