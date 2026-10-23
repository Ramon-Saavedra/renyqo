"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { subscribeConversationAttention } from "@/lib/realtime/attention";
import { getProviderListings } from "../api/provider-listings";
import type { ListingOverviewItem } from "../types";

export function useProviderListingsRealtimeRefresh(
  enabled: boolean,
  apply: (listings: readonly ListingOverviewItem[]) => void,
) {
  const [state, setState] = useState<{
    status: "loading" | "idle" | "error";
    error: string | null;
    refreshError: string | null;
  }>({ status: enabled ? "loading" : "idle", error: null, refreshError: null });
  const retryRef = useRef<() => void>(() => undefined);
  const retry = useCallback(() => retryRef.current(), []);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  useEffect(() => {
    if (!enabled) return;
    let request = 0;
    let active = true;
    let hasLoaded = false;
    const load = () => {
      const current = ++request;
      if (!hasLoaded)
        setState({ status: "loading", error: null, refreshError: null });
      void getProviderListings()
        .then((listings) => {
          if (!active || current !== request) return;
          hasLoaded = true;
          applyRef.current(listings);
          setState({ status: "idle", error: null, refreshError: null });
        })
        .catch((error: unknown) => {
          if (!active || current !== request) return;
          const message =
            error instanceof ApiError && error.status === 0
              ? "Netzwerkfehler — bitte versuche es erneut"
              : "Mietobjekte konnten nicht geladen werden";
          setState(
            hasLoaded
              ? {
                  status: "idle",
                  error: null,
                  refreshError:
                    "Die Übersicht konnte nicht aktualisiert werden. Die angezeigten Daten sind möglicherweise veraltet.",
                }
              : { status: "error", error: message, refreshError: null },
          );
        });
    };
    retryRef.current = load;
    const unsubscribe = subscribeConversationAttention((notice) => {
      if (notice.refreshLists) load();
    });
    load();
    return () => {
      active = false;
      request += 1;
      retryRef.current = () => undefined;
      unsubscribe();
    };
  }, [enabled]);
  return { ...state, retry };
}
