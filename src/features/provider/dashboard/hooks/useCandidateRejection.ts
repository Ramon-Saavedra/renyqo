"use client";

import { useCallback, useRef, useState } from "react";
import { rejectProviderApplication } from "../api/provider-application-rejection";

type CandidateRejectionState =
  | { readonly status: "idle" }
  | { readonly status: "submitting"; readonly applicationId: string }
  | { readonly status: "error"; readonly applicationId: string };

export function useCandidateRejection() {
  const [state, setState] = useState<CandidateRejectionState>({
    status: "idle",
  });
  const isSubmittingRef = useRef(false);

  const rejectCandidate = useCallback(
    async (applicationId: string): Promise<boolean> => {
      if (isSubmittingRef.current) return false;

      isSubmittingRef.current = true;
      setState({ status: "submitting", applicationId });

      try {
        await rejectProviderApplication(applicationId);
        setState({ status: "idle" });
        return true;
      } catch {
        setState({ status: "error", applicationId });
        return false;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (!isSubmittingRef.current) setState({ status: "idle" });
  }, []);

  return { state, rejectCandidate, reset } as const;
}
