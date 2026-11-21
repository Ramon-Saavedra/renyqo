import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { getAttentionAggregate } from "@/lib/attention/api/get-attention-aggregate";
import { emptyAttentionTotals } from "@/lib/attention/fixtures";
import { useGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import {
  WorkspaceFixture,
  current,
  deferred,
  scopeFor,
  workspaceA,
  workspaceB,
} from "./testing/workspace-fixture";
import type { AttentionAggregateResponse } from "@/lib/attention/types";
vi.mock("@/lib/attention/api/get-attention-aggregate", () => ({
  getAttentionAggregate: vi.fn(),
}));
function page(count: number): AttentionAggregateResponse {
  return {
    asOf: "2026-11-20T10:00:00.000Z",
    items: [],
    listings: [],
    totals: { ...emptyAttentionTotals(), actionableUnreadMessageCount: count },
    pagination: { offset: 0, limit: 20, hasMore: false, totalApplications: 0 },
  };
}
describe("provider attention scope", () => {
  it("isolates counts and ignores an ineffective-abort late response after A → B → A", async () => {
    const first = deferred<AttentionAggregateResponse>();
    vi.mocked(getAttentionAggregate)
      .mockReset()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(page(2))
      .mockResolvedValueOnce(page(3));
    const wrapper = ({
      children,
      id,
      generation,
    }: {
      children: ReactNode;
      id: string;
      generation: string;
    }) => (
      <WorkspaceFixture
        key={generation}
        scope={scopeFor(current(id), generation)}
      >
        {children}
      </WorkspaceFixture>
    );
    const hook = renderHook(() => useGlobalAttention("provider"), {
      wrapper: ({ children }) =>
        wrapper({ children, id: workspaceA, generation: "first-A" }),
    });
    await waitFor(() => expect(getAttentionAggregate).toHaveBeenCalledTimes(1));
    hook.unmount();
    const b = renderHook(() => useGlobalAttention("provider"), {
      wrapper: ({ children }) =>
        wrapper({ children, id: workspaceB, generation: "B" }),
    });
    expect(b.result.current.messageCount).toBe(0);
    await waitFor(() => expect(b.result.current.messageCount).toBe(2));
    b.unmount();
    const a = renderHook(() => useGlobalAttention("provider"), {
      wrapper: ({ children }) =>
        wrapper({ children, id: workspaceA, generation: "new-A" }),
    });
    expect(a.result.current.messageCount).toBe(0);
    await waitFor(() => expect(a.result.current.messageCount).toBe(3));
    await act(async () => first.resolve(page(99)));
    expect(a.result.current.messageCount).toBe(3);
    a.unmount();
  });
  it("survives React StrictMode subscription cleanup without reviving stale data", async () => {
    vi.mocked(getAttentionAggregate).mockReset().mockResolvedValue(page(4));
    const scope = scopeFor(current(), "strict-mode");
    const { result } = renderHook(() => useGlobalAttention("provider"), {
      wrapper: ({ children }) => (
        <StrictMode>
          <WorkspaceFixture scope={scope}>{children}</WorkspaceFixture>
        </StrictMode>
      ),
    });
    await waitFor(() => expect(result.current.messageCount).toBe(4));
  });
});
