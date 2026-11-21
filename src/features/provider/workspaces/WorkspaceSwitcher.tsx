"use client";
import { useOptionalProviderWorkspace } from "./scope-context";
import { WorkspaceSelector } from "./WorkspaceSelector";
export function WorkspaceSwitcher() {
  const scope = useOptionalProviderWorkspace();
  if (!scope || scope.workspaces.length < 2) return null;
  return (
    <WorkspaceSelector
      workspaces={scope.workspaces}
      selected={scope.current.workspace.id}
      onSelect={scope.select}
    />
  );
}
