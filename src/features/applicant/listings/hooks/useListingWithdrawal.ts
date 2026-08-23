"use client";

import { useCallback, useRef, useState } from "react";
import { withdrawListingApplication } from "../api/listing-withdrawal";

export type ListingWithdrawalState =
  | { readonly status: "idle" }
  | { readonly status: "submitting" }
  | { readonly status: "success" }
  | { readonly status: "error" };

export function useListingWithdrawal(applicationId: string | null) {
  const [state, setState] = useState<ListingWithdrawalState>({ status: "idle" });
  const isSubmittingRef = useRef(false);
  const withdraw = async (): Promise<boolean> => {
    if (!applicationId || isSubmittingRef.current || state.status === "success") return false;
    isSubmittingRef.current = true;
    setState({ status: "submitting" });
    try {
      await withdrawListingApplication(applicationId);
      setState({ status: "success" });
      isSubmittingRef.current = false;
      return true;
    } catch {
      setState({ status: "error" });
    }
    isSubmittingRef.current = false;
    return false;
  };
  const reset = useCallback(() => setState({ status: "idle" }), []);
  return { state, withdraw, reset } as const;
}
