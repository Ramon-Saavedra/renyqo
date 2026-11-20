"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { discoverWorkspaces, readCurrentWorkspace } from "./api";
import { workspaceRequestOptions } from "./request-scope";
import type { CurrentWorkspace, DiscoverableWorkspace } from "./contracts";

export type WorkspaceBootstrapState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "select" | "empty" | "inaccessible";
      workspaces: readonly DiscoverableWorkspace[];
    }
  | {
      status: "ready";
      key: string;
      current: CurrentWorkspace;
      workspaces: readonly DiscoverableWorkspace[];
      requestOptions: ReturnType<typeof workspaceRequestOptions>;
    };

export function useWorkspaceBootstrap(
  candidate: string | null,
  reload: number,
) {
  const [result, setResult] = useState<{
    candidate: string | null;
    reload: number;
    state: WorkspaceBootstrapState;
  } | null>(null);
  const [seen, setSeen] = useState({ candidate, reload });
  const changed = seen.candidate !== candidate || seen.reload !== reload;
  if (changed) {
    setSeen({ candidate, reload });
    setResult(null);
  }
  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const attempt = ++generation.current;
    const publish = (state: WorkspaceBootstrapState) => {
      if (!controller.signal.aborted && attempt === generation.current)
        setResult({ candidate, reload, state });
    };
    void (async () => {
      const workspaces = await discoverWorkspaces(controller.signal);
      if (controller.signal.aborted) return;
      if (!workspaces.length) {
        publish({ status: "empty", workspaces });
        return;
      }
      const selected = candidate
        ? workspaces.find((w) => w.workspaceId === candidate)
        : workspaces.length === 1
          ? workspaces[0]
          : undefined;
      if (!selected) {
        publish({ status: candidate ? "inaccessible" : "select", workspaces });
        return;
      }
      const requestOptions = workspaceRequestOptions(
        selected.workspaceId,
        controller.signal,
      );
      try {
        const current = await readCurrentWorkspace(requestOptions);
        if (
          current.workspace.id !== selected.workspaceId ||
          current.membership.id !== selected.membershipId
        )
          throw new Error("Workspace response mismatch");
        publish({
          status: "ready",
          key: selected.workspaceId + ":" + attempt,
          current,
          workspaces,
          requestOptions,
        });
      } catch (error) {
        if (error instanceof ApiError && [403, 404].includes(error.status))
          publish({ status: "inaccessible", workspaces });
        else throw error;
      }
    })().catch(() => publish({ status: "error" }));
    return () => {
      controller.abort();
    };
  }, [candidate, reload]);
  // Hide the previous scope during the render that observes a changed URL, before effects run.
  return !changed && result?.candidate === candidate && result.reload === reload
    ? result.state
    : ({ status: "loading" } as const);
}
