"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getApplicantWorkspace,
  WorkspaceContractError,
  WorkspaceInaccessibleError,
  type ApplicantWorkspace,
} from "../api/workspace";

export type WorkspaceLoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly workspace: ApplicantWorkspace }
  | { readonly status: "error"; readonly reason: "request" | "contract" }
  | { readonly status: "inaccessible" };

export function useApplicantWorkspace(applicationId: string): {
  readonly state: WorkspaceLoadState;
  readonly reload: () => void;
} {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<WorkspaceLoadState>({ status: "loading" });
  const [trackedApplicationId, setTrackedApplicationId] =
    useState(applicationId);

  if (trackedApplicationId !== applicationId) {
    setTrackedApplicationId(applicationId);
    setState({ status: "loading" });
  }

  const reload = useCallback(() => {
    setState((current) =>
      current.status === "ready" ? current : { status: "loading" },
    );
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void getApplicantWorkspace(applicationId, { signal: controller.signal })
      .then((workspace) => {
        if (active) setState({ status: "ready", workspace });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.kind === "cancelled") return;
        if (error instanceof WorkspaceInaccessibleError) {
          setState({ status: "inaccessible" });
          return;
        }
        setState({
          status: "error",
          reason:
            error instanceof WorkspaceContractError ? "contract" : "request",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [applicationId, reloadKey]);

  return { state, reload };
}
