"use client";

import { useEffect, useRef } from "react";

export function useAttentionRevalidate(
  nextRevalidateAt: string | null,
  refetch: () => void,
): void {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!nextRevalidateAt) return;
    const target = Date.parse(nextRevalidateAt);
    if (Number.isNaN(target)) return;
    const delay = target - Date.now();
    if (delay <= 0) {
      refetchRef.current();
      return;
    }
    const timer = window.setTimeout(() => refetchRef.current(), delay);
    return () => window.clearTimeout(timer);
  }, [nextRevalidateAt]);
}
