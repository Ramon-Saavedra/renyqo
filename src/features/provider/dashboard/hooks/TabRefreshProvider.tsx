"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const COALESCE_MS = 250;

const TabRefreshContext = createContext<number>(0);

interface TabRefreshProviderProps {
  readonly children: ReactNode;
}

export function TabRefreshProvider({ children }: TabRefreshProviderProps) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let lastRefreshAt = 0;

    function requestRefresh() {
      const now = Date.now();
      if (now - lastRefreshAt < COALESCE_MS) return;
      lastRefreshAt = now;
      setRevision((current) => current + 1);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestRefresh();
      }
    }

    window.addEventListener("focus", requestRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", requestRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <TabRefreshContext.Provider value={revision}>
      {children}
    </TabRefreshContext.Provider>
  );
}

export function useTabRefreshRevision(): number {
  return useContext(TabRefreshContext);
}
