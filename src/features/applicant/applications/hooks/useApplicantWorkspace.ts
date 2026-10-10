"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApplicantApplicationContractError,
  ApplicantApplicationNotFoundError,
  isCancelledRequest,
} from "../api/errors";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
} from "../api/workspace";
import type { LoadFailure } from "./useApplicationsOverview";

export type WorkspaceState =
  | { readonly status: "loading" }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly reason: LoadFailure }
  | {
      readonly status: "ready";
      readonly workspace: ApplicantWorkspace;
      readonly refreshing: boolean;
      readonly refreshFailed: boolean;
      readonly acceptedGeneration: number;
    };

function isNewerSnapshot(
  candidate: ApplicantWorkspace,
  current: ApplicantWorkspace,
): boolean {
  return Date.parse(candidate.asOf) >= Date.parse(current.asOf);
}

export function useApplicantWorkspace(applicationId: string): {
  readonly state: WorkspaceState;
  readonly refresh: () => number;
  readonly retry: () => void;
} {
  const [state, setState] = useState<WorkspaceState>({ status: "loading" });
  const [trackedId, setTrackedId] = useState(applicationId);
  const [requestKey, setRequestKey] = useState(0);
  const generationRef = useRef(0);
  const inFlightRef = useRef(true);

  if (trackedId !== applicationId) {
    setTrackedId(applicationId);
    setState({ status: "loading" });
  }

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    inFlightRef.current = true;
    const controller = new AbortController();

    getApplicantWorkspace(applicationId, { signal: controller.signal })
      .then((workspace) => {
        if (controller.signal.aborted || generationRef.current !== generation)
          return;
        setState((current) => {
          if (
            current.status === "ready" &&
            current.workspace.application.id === applicationId &&
            !isNewerSnapshot(workspace, current.workspace)
          ) {
            return { ...current, refreshing: false, refreshFailed: true };
          }
          return {
            status: "ready",
            workspace,
            refreshing: false,
            refreshFailed: false,
            acceptedGeneration: generation,
          };
        });
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          generationRef.current !== generation ||
          isCancelledRequest(error)
        )
          return;
        if (error instanceof ApplicantApplicationNotFoundError) {
          setState({ status: "not-found" });
          return;
        }
        setState((current) =>
          current.status === "ready" &&
          current.workspace.application.id === applicationId
            ? { ...current, refreshing: false, refreshFailed: true }
            : {
                status: "error",
                reason:
                  error instanceof ApplicantApplicationContractError
                    ? "contract"
                    : "request",
              },
        );
      })
      .finally(() => {
        if (generationRef.current === generation) inFlightRef.current = false;
      });

    return () => controller.abort();
  }, [applicationId, requestKey]);

  const refresh = useCallback(() => {
    generationRef.current += 1;
    inFlightRef.current = true;
    setState((current) =>
      current.status === "ready"
        ? { ...current, refreshing: true, refreshFailed: false }
        : { status: "loading" },
    );
    setRequestKey((key) => key + 1);
    return generationRef.current + 1;
  }, []);

  const retry = useCallback(() => {
    generationRef.current += 1;
    inFlightRef.current = true;
    setState({ status: "loading" });
    setRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState !== "visible" || inFlightRef.current) return;
      refresh();
    };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [refresh]);

  return { state, refresh, retry };
}
