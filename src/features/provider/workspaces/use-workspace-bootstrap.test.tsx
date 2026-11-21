import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { discoverWorkspaces, readCurrentWorkspace } from "./api";
import { useWorkspaceBootstrap } from "./use-workspace-bootstrap";
import {
  current,
  discovery,
  deferred,
  workspaceA,
  workspaceB,
} from "./testing/workspace-fixture";
vi.mock("./api", () => ({
  discoverWorkspaces: vi.fn(),
  readCurrentWorkspace: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(discoverWorkspaces).mockReset();
  vi.mocked(readCurrentWorkspace).mockReset();
});
describe("workspace bootstrap", () => {
  it("represents zero workspaces explicitly", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([]);
    const { result } = renderHook(() => useWorkspaceBootstrap(null, 0));
    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(readCurrentWorkspace).not.toHaveBeenCalled();
  });
  it("automatically validates the only workspace", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([discovery()]);
    vi.mocked(readCurrentWorkspace).mockResolvedValue(current());
    const { result } = renderHook(() => useWorkspaceBootstrap(null, 0));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(
      new Headers(
        vi.mocked(readCurrentWorkspace).mock.calls[0]![0].headers,
      ).get("x-workspace-id"),
    ).toBe(workspaceA);
  });
  it("requires explicit selection with multiple workspaces", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([
      discovery(),
      discovery(workspaceB),
    ]);
    const { result } = renderHook(() => useWorkspaceBootstrap(null, 0));
    await waitFor(() => expect(result.current.status).toBe("select"));
    expect(readCurrentWorkspace).not.toHaveBeenCalled();
  });
  it("validates an AGENT selection without reconstructing authority", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([
      discovery(workspaceA, "AGENT"),
      discovery(workspaceB),
    ]);
    vi.mocked(readCurrentWorkspace).mockResolvedValue(
      current(workspaceA, "AGENT"),
    );
    const { result } = renderHook(() => useWorkspaceBootstrap(workspaceA, 0));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(readCurrentWorkspace).toHaveBeenCalledTimes(1);
  });
  it("rejects stale/foreign URL selections without querying them", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([discovery()]);
    const { result } = renderHook(() => useWorkspaceBootstrap(workspaceB, 0));
    await waitFor(() => expect(result.current.status).toBe("inaccessible"));
    expect(readCurrentWorkspace).not.toHaveBeenCalled();
  });
  it("handles authority revoked after discovery", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([discovery()]);
    vi.mocked(readCurrentWorkspace).mockRejectedValue(
      new ApiError(403, "Unavailable"),
    );
    const { result } = renderHook(() => useWorkspaceBootstrap(workspaceA, 0));
    await waitFor(() => expect(result.current.status).toBe("inaccessible"));
  });
  it("shows request errors without enabling operational children", async () => {
    vi.mocked(discoverWorkspaces).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useWorkspaceBootstrap(workspaceA, 0));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
  it("hides A immediately, aborts it, and rejects late responses across A → B → A", async () => {
    const first = deferred<ReturnType<typeof current>>();
    vi.mocked(discoverWorkspaces).mockResolvedValue([
      discovery(),
      discovery(workspaceB),
    ]);
    vi.mocked(readCurrentWorkspace)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(current(workspaceB))
      .mockResolvedValueOnce(current());
    const { result, rerender } = renderHook(
      ({ id }) => useWorkspaceBootstrap(id, 0),
      { initialProps: { id: workspaceA } },
    );
    await waitFor(() => expect(readCurrentWorkspace).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(readCurrentWorkspace).mock.calls[0]![0].signal;
    rerender({ id: workspaceB });
    expect(result.current.status).toBe("loading");
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ id: workspaceA });
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const latest = result.current;
    await act(async () =>
      first.resolve({
        ...current(),
        workspace: { ...current().workspace, displayName: "STALE" },
      }),
    );
    expect(result.current).toBe(latest);
  });
});
