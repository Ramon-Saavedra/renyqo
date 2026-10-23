"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isRealtimeEnabled } from "@/lib/env";
import { useCurrentUser } from "@/lib/api/use-current-user";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { normalizeRole } from "@/lib/normalize-role";
import {
  scheduleConversationMessage,
  scheduleConversationSummary,
  scheduleRealtimeResync,
  resetRealtimeSchedules,
} from "@/lib/realtime/attention";
import {
  connectRealtime,
  disconnectRealtime,
  isRealtimeReconnectionPaused,
  pauseRealtimeReconnection,
} from "@/lib/realtime/client";
import { dispatchDomainEvent } from "@/lib/realtime/dispatcher";
import {
  isAuthRequiredError,
  recoverRealtimeSession,
} from "@/lib/realtime/session-guard";

interface RealtimeProviderProps {
  readonly children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, loading, error } = useCurrentUser();
  const userId = user?.id ?? null;
  const role = normalizeRole(user?.role);
  const enabled =
    isRealtimeEnabled() &&
    !loading &&
    !error &&
    user !== null &&
    userId !== null &&
    role !== null;
  const roleRef = useRef<GlobalAttentionRole | null>(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (!enabled) {
      resetRealtimeSchedules();
      disconnectRealtime();
      return;
    }

    connectRealtime({
      onDomainEvent: (payload) => {
        const role = roleRef.current;
        if (!role) return;
        dispatchDomainEvent(payload, {
          message: (applicationId) =>
            scheduleConversationMessage(role, applicationId),
          summary: (applicationId) =>
            scheduleConversationSummary(role, applicationId),
        });
      },
      onConnected: () => {
        const role = roleRef.current;
        if (role) scheduleRealtimeResync(role);
      },
      onConnectError: (connectError) => {
        if (!isAuthRequiredError(connectError)) return;
        pauseRealtimeReconnection();
        void recoverRealtimeSession();
      },
      onServerDisconnect: () => {
        pauseRealtimeReconnection();
        void recoverRealtimeSession();
      },
    });

    return () => {
      resetRealtimeSchedules();
      disconnectRealtime();
    };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (isRealtimeReconnectionPaused()) {
        void recoverRealtimeSession();
        return;
      }
      const role = roleRef.current;
      if (role) scheduleRealtimeResync(role);
    };

    const onOnline = () => {
      if (isRealtimeReconnectionPaused()) void recoverRealtimeSession();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, userId]);

  return children;
}
