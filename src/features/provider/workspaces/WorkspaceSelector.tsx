"use client";
import { Select } from "@/components/ui/form/Select";
import type { DiscoverableWorkspace } from "./contracts";

export function WorkspaceSelector({
  workspaces,
  selected,
  onSelect,
}: {
  workspaces: readonly DiscoverableWorkspace[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <label className="inline-flex max-w-64 items-center gap-2 text-caption">
      <span className="sr-only">Arbeitsbereich</span>
      <Select
        aria-label="Arbeitsbereich"
        value={selected ?? ""}
        onChange={(event) => {
          if (event.target.value) onSelect(event.target.value);
        }}
      >
        <option value="" disabled>
          Arbeitsbereich wählen
        </option>
        {workspaces.map((workspace) => (
          <option key={workspace.workspaceId} value={workspace.workspaceId}>
            {workspace.displayName}
          </option>
        ))}
      </Select>
    </label>
  );
}
