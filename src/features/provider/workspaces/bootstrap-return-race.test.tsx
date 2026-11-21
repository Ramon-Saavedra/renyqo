import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
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
it("does not revive a previously ready A while B or the new A request is pending", async () => {
  const b = deferred<ReturnType<typeof current>>(),
    next = deferred<ReturnType<typeof current>>();
  vi.mocked(discoverWorkspaces).mockResolvedValue([
    discovery(),
    discovery(workspaceB),
  ]);
  vi.mocked(readCurrentWorkspace)
    .mockResolvedValueOnce(current())
    .mockReturnValueOnce(b.promise)
    .mockReturnValueOnce(next.promise);
  const { result, rerender } = renderHook(
    ({ id }) => useWorkspaceBootstrap(id, 0),
    { initialProps: { id: workspaceA } },
  );
  await waitFor(() => expect(result.current.status).toBe("ready"));
  const original = result.current;
  rerender({ id: workspaceB });
  await waitFor(() => expect(readCurrentWorkspace).toHaveBeenCalledTimes(2));
  expect(result.current.status).toBe("loading");
  rerender({ id: workspaceA });
  expect(result.current.status).toBe("loading");
  await waitFor(() => expect(readCurrentWorkspace).toHaveBeenCalledTimes(3));
  await act(async () => b.resolve(current(workspaceB)));
  expect(result.current.status).toBe("loading");
  await act(async () => next.resolve(current()));
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current).not.toBe(original);
  if (original.status === "ready" && result.current.status === "ready") {
    expect(result.current.key).not.toBe(original.key);
    expect(original.requestOptions.signal?.aborted).toBe(true);
  }
});
