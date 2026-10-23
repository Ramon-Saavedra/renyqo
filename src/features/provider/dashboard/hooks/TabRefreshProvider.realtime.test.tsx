import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REALTIME_COALESCE_MS,
  resetRealtimeSchedules,
  scheduleConversationMessage,
} from "@/lib/realtime/attention";
import {
  TabRefreshProvider,
  useTabRefreshRevision,
} from "./TabRefreshProvider";

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

function RevisionProbe() {
  const revision = useTabRefreshRevision();
  return <output>{revision}</output>;
}

describe("provider dashboard realtime refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetRealtimeSchedules();
    vi.useRealTimers();
  });

  it("bumps the dashboard revision once for a message burst", async () => {
    render(
      <TabRefreshProvider>
        <RevisionProbe />
      </TabRefreshProvider>,
    );
    expect(screen.getByText("0")).toBeInstanceOf(HTMLElement);
    await act(async () => {
      scheduleConversationMessage("provider", "application-1");
      scheduleConversationMessage("provider", "application-2");
      await vi.advanceTimersByTimeAsync(REALTIME_COALESCE_MS);
    });
    expect(screen.getByText("1")).toBeInstanceOf(HTMLElement);
  });
});
