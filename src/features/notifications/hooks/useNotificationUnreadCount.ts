"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeConversationAttention } from "@/lib/realtime/attention";
import { getNotificationUnreadCount } from "../api/notifications";

export function useNotificationUnreadCount() {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotificationUnreadCount();
      setCount(result.unreadCount);
    } catch {
      // A failed refresh keeps the last count from the unread endpoint.
    }
  }, []);

  useEffect(
    () =>
      subscribeConversationAttention((notice) => {
        if (notice.refreshNotifications) void refresh();
      }),
    [refresh],
  );

  useEffect(() => {
    let active = true;
    getNotificationUnreadCount()
      .then((result) => {
        if (active) setCount(result.unreadCount);
      })
      .catch(() => {
        // Leave the badge unchanged when the count request fails.
      });
    return () => {
      active = false;
    };
  }, []);

  return { count, refresh };
}
