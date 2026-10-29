"use client";

import { useEffect, useRef } from "react";
import { scheduleRevalidate } from "./schedule-revalidate";

export function useAttentionRevalidate(
  nextRevalidateAt: string | null,
  refetch: () => void,
): void {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    return scheduleRevalidate(nextRevalidateAt, () => refetchRef.current());
  }, [nextRevalidateAt]);
}
