"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const COALESCE_MS = 250;

const TabRefreshContext = createContext<number>(0);
const TabRefreshRequestContext = createContext<() => void>(() => undefined);

interface TabRefreshProviderProps {
  readonly children: ReactNode;
}

export function TabRefreshProvider({ children }: TabRefreshProviderProps) {
  const [revision, setRevision] = useState(0);
  const requestRefresh = useCallback(() => {
    setRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    let lastRefreshAt = 0;

    function requestCoalescedRefresh() {
      const now = Date.now();
      if (now - lastRefreshAt < COALESCE_MS) return;
      lastRefreshAt = now;
      requestRefresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestCoalescedRefresh();
      }
    }

    window.addEventListener("focus", requestCoalescedRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", requestCoalescedRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestRefresh]);

  return (
    <TabRefreshRequestContext.Provider value={requestRefresh}>
      <TabRefreshContext.Provider value={revision}>
        {children}
      </TabRefreshContext.Provider>
    </TabRefreshRequestContext.Provider>
  );
}

export function useTabRefreshRevision(): number {
  return useContext(TabRefreshContext);
}

export function useRequestTabRefresh(): () => void {
  return useContext(TabRefreshRequestContext);
}
