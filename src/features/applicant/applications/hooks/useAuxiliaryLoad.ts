"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiRequestOptions } from "@/lib/api/client";
import { isCancelledRequest } from "../api/errors";

export type AuxiliaryState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly data: T }
  | { readonly status: "error" };

export interface AuxiliaryLoad<T> {
  readonly state: AuxiliaryState<T>;
  readonly retry: () => void;
}

export function useAuxiliaryLoad<T>(
  key: string,
  enabled: boolean,
  load: (options: ApiRequestOptions) => Promise<T>,
): AuxiliaryLoad<T> {
  const [result, setResult] = useState<{
    readonly key: string;
    readonly state: AuxiliaryState<T>;
  } | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    if (!enabled) return;
    const controller = new AbortController();
    load({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted && generationRef.current === generation)
          setResult({ key, state: { status: "ready", data } });
      })
      .catch((error: unknown) => {
        if (
          !controller.signal.aborted &&
          generationRef.current === generation &&
          !isCancelledRequest(error)
        )
          setResult({ key, state: { status: "error" } });
      });
    return () => controller.abort();
  }, [key, enabled, load, retryKey]);

  const retry = useCallback(() => {
    generationRef.current += 1;
    setResult(null);
    setRetryKey((current) => current + 1);
  }, []);

  return {
    state: !enabled
      ? { status: "idle" }
      : result?.key === key
        ? result.state
        : { status: "loading" },
    retry,
  };
}
