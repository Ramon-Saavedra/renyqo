"use client";

import { useCallback, useRef, useState } from "react";
import { restoreProviderApplication } from "../api/provider-application-restore";

export type CandidateRestorationState =
  | { readonly status: "idle" }
  | { readonly status: "submitting"; readonly applicationId: string }
  | { readonly status: "error"; readonly applicationId: string };

export function useCandidateRestoration() {
  const [state, setState] = useState<CandidateRestorationState>({
    status: "idle",
  });
  const isSubmittingRef = useRef(false);

  const restoreCandidate = useCallback(
    async (applicationId: string): Promise<boolean> => {
      if (isSubmittingRef.current) return false;

      isSubmittingRef.current = true;
      setState({ status: "submitting", applicationId });

      try {
        await restoreProviderApplication(applicationId);
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

  return { state, restoreCandidate, reset } as const;
}
