"use client";
import type { ViewingSnapshotOwner } from "@/features/viewing-workflow/snapshot/owner";
import { createContext, useContext, type ReactNode } from "react";
import type { ApiRequestOptions } from "@/lib/api/client";
import type { CurrentWorkspace, DiscoverableWorkspace } from "./contracts";

export interface ProviderWorkspaceScope {
  readonly key: string;
  readonly viewingOwner: ViewingSnapshotOwner;
  readonly current: CurrentWorkspace;
  readonly workspaces: readonly DiscoverableWorkspace[];
  readonly requestOptions: ApiRequestOptions;
  readonly select: (workspaceId: string) => void;
}
const Context = createContext<ProviderWorkspaceScope | null>(null);
export function ProviderWorkspaceScopeProvider({
  value,
  children,
}: {
  value: ProviderWorkspaceScope;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOptionalProviderWorkspace() {
  return useContext(Context);
}
export function useProviderWorkspace() {
  const scope = useContext(Context);
  if (!scope) throw new Error("Provider workspace boundary required");
  return scope;
}
