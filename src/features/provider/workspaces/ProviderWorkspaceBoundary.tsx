"use client";
import { createViewingSnapshotOwner } from "@/features/viewing-workflow/snapshot/owner";
import type { ProviderWorkspaceScope } from "./scope-context";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUrlSearch } from "@/lib/navigation/url-search";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { Button } from "@/components/ui/button/Button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { ProviderWorkspaceScopeProvider } from "./scope-context";
import { useWorkspaceBootstrap } from "./use-workspace-bootstrap";
import {
  WORKSPACE_QUERY,
  providerWorkspaceHref,
  workspaceSwitchHref,
} from "./navigation";
import { WorkspaceSelector } from "./WorkspaceSelector";

function WorkspaceBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useUrlSearch();
  const candidate = new URLSearchParams(search).get(WORKSPACE_QUERY);
  const [reload, setReload] = useState(0);
  const state = useWorkspaceBootstrap(candidate, reload);
  const select = useCallback(
    (id: string) => {
      setReload((value) => value + 1);
      router.push(workspaceSwitchHref(id));
    },
    [router],
  );
  useEffect(() => {
    if (state.status === "ready" && !candidate)
      router.replace(
        providerWorkspaceHref(pathname + search, state.current.workspace.id),
      );
  }, [state, candidate, pathname, search, router]);
  if (state.status === "ready")
    return (
      <ScopedWorkspace key={state.key} value={{ ...state, select }}>
        {children}
      </ScopedWorkspace>
    );
  return (
    <PageShell>
      <section className="px-gutter py-section" aria-label="Arbeitsbereich">
        <h1 className="mb-4 text-heading-lg">Arbeitsbereich</h1>
        {state.status === "loading" ? (
          <p role="status">Arbeitsbereich wird geladen …</p>
        ) : null}
        {state.status === "empty" ? (
          <p>Für dieses Konto ist kein Arbeitsbereich verfügbar.</p>
        ) : null}
        {state.status === "error" ? (
          <>
            <FormAlert
              variant="error"
              message="Arbeitsbereiche konnten nicht geladen werden."
            />
            <Button onClick={() => setReload((value) => value + 1)}>
              Erneut versuchen
            </Button>
          </>
        ) : null}
        {state.status === "inaccessible" ? (
          <FormAlert
            variant="error"
            message="Dieser Arbeitsbereich ist nicht verfügbar. Bitte wähle einen verfügbaren Arbeitsbereich."
          />
        ) : null}
        {"workspaces" in state && state.workspaces.length ? (
          <WorkspaceSelector
            workspaces={state.workspaces}
            selected={null}
            onSelect={select}
          />
        ) : null}
      </section>
    </PageShell>
  );
}
export function ProviderWorkspaceBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  return pathname.startsWith("/provider/") ? (
    <WorkspaceBoundary>{children}</WorkspaceBoundary>
  ) : (
    children
  );
}

function ScopedWorkspace({
  value,
  children,
}: {
  value: Omit<ProviderWorkspaceScope, "viewingOwner">;
  children: ReactNode;
}) {
  const viewingOwner = useMemo(
    () => createViewingSnapshotOwner(value.requestOptions),
    [value.requestOptions],
  );
  useEffect(() => () => viewingOwner.dispose(), [viewingOwner]);
  return (
    <ProviderWorkspaceScopeProvider value={{ ...value, viewingOwner }}>
      {children}
    </ProviderWorkspaceScopeProvider>
  );
}
