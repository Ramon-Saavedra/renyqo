"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { withdrawListingApplication } from "../api/listing-withdrawal";

export type ListingWithdrawalState =
  | { readonly status: "idle" }
  | { readonly status: "submitting" }
  | { readonly status: "success" }
  | { readonly status: "error" };

export function useListingWithdrawal(applicationId: string | null) {
  const [state, setState] = useState<ListingWithdrawalState>({
    status: "idle",
  });
  const isSubmittingRef = useRef(false);
  const generation = useRef(0);
  useLayoutEffect(() => {
    return () => {
      generation.current += 1;
      isSubmittingRef.current = false;
    };
  }, [applicationId]);
  const withdraw = async (): Promise<boolean> => {
    if (!applicationId || isSubmittingRef.current || state.status === "success")
      return false;
    const requestGeneration = generation.current;
    isSubmittingRef.current = true;
    setState({ status: "submitting" });
    try {
      await withdrawListingApplication(applicationId);
      if (requestGeneration !== generation.current) return false;
      setState({ status: "success" });
      return true;
    } catch {
      if (requestGeneration !== generation.current) return false;
      setState({ status: "error" });
    } finally {
      if (requestGeneration === generation.current)
        isSubmittingRef.current = false;
    }
    return false;
  };
  const reset = useCallback(() => setState({ status: "idle" }), []);
  const [trackedId, setTrackedId] = useState(applicationId);
  if (trackedId !== applicationId) {
    setTrackedId(applicationId);
    setState({ status: "idle" });
  }
  return { state, withdraw, reset } as const;
}
