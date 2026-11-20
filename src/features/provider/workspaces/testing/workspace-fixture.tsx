import type { ReactNode } from "react";
import { createViewingSnapshotOwner } from "@/features/viewing-workflow/snapshot/owner";
import {
  ProviderWorkspaceScopeProvider,
  type ProviderWorkspaceScope,
} from "../scope-context";
import { workspaceRequestOptions } from "../request-scope";
import type { CurrentWorkspace, DiscoverableWorkspace } from "../contracts";
export const workspaceA = "11111111-1111-4111-8111-111111111111";
export const workspaceB = "22222222-2222-4222-8222-222222222222";
export function discovery(
  id = workspaceA,
  role: "OWNER" | "AGENT" = "OWNER",
): DiscoverableWorkspace {
  return {
    workspaceId: id,
    membershipId: id,
    role,
    kind: "ORGANIZATION",
    displayName: id === workspaceA ? "Organisation A" : "Organisation B",
  };
}
export function current(
  id = workspaceA,
  role: "OWNER" | "AGENT" = "OWNER",
): CurrentWorkspace {
  return {
    workspace: {
      id,
      kind: "ORGANIZATION",
      displayName: discovery(id).displayName,
    },
    membership: { id, role, colorId: "sky" },
    actions: {
      createListing: { allowed: true, reason: null },
      reorderListings: { allowed: true },
    },
  };
}
export function scopeFor(
  projection = current(),
  key = projection.workspace.id,
): ProviderWorkspaceScope {
  const controller = new AbortController();
  const requestOptions = workspaceRequestOptions(
    projection.workspace.id,
    controller.signal,
  );
  return {
    key,
    current: projection,
    workspaces: [discovery(workspaceA), discovery(workspaceB)],
    requestOptions,
    viewingOwner: createViewingSnapshotOwner(requestOptions),
    select: () => {},
  };
}
export function WorkspaceFixture({
  children,
  scope = scopeFor(),
}: {
  children: ReactNode;
  scope?: ProviderWorkspaceScope;
}) {
  return (
    <ProviderWorkspaceScopeProvider value={scope}>
      {children}
    </ProviderWorkspaceScopeProvider>
  );
}
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
