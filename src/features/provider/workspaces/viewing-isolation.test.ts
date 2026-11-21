import { describe, expect, it, vi } from "vitest";
import { createViewingSnapshotOwner } from "@/features/viewing-workflow/snapshot/owner";
import { getProviderViewingWorkflow } from "@/features/viewing-workflow/api/provider-workflow";
import { workspaceRequestOptions } from "./request-scope";
import { workspaceA, workspaceB, deferred } from "./testing/workspace-fixture";
import type { ViewingWorkflowSnapshot } from "@/lib/viewing-workflow/snapshot-schema";
vi.mock("@/features/viewing-workflow/api/provider-workflow", () => ({
  getProviderViewingWorkflow: vi.fn(),
}));
describe("viewing scope lifetime", () => {
  it("never publishes a late A response into B or a new A generation", async () => {
    const old = deferred<ViewingWorkflowSnapshot>();
    vi.mocked(getProviderViewingWorkflow)
      .mockReturnValueOnce(old.promise)
      .mockRejectedValue(new Error("unavailable"));
    const a = createViewingSnapshotOwner(
      workspaceRequestOptions(workspaceA, new AbortController().signal),
    );
    const b = createViewingSnapshotOwner(
      workspaceRequestOptions(workspaceB, new AbortController().signal),
    );
    const nextA = createViewingSnapshotOwner(
      workspaceRequestOptions(workspaceA, new AbortController().signal),
    );
    const pending = a.ensureViewingSnapshot("same-resource", "provider");
    a.dispose();
    old.reject(new Error("late A"));
    await pending;
    expect(b.getViewingSnapshotState("same-resource").status).toBe("idle");
    expect(nextA.getViewingSnapshotState("same-resource").status).toBe("idle");
    expect(a.getViewingSnapshotState("same-resource").status).toBe("idle");
    b.dispose();
    nextA.dispose();
  });
});
