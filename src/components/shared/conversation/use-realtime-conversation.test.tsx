import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catchUpOpenConversation } from "@/lib/realtime/open-conversations";
import { useRealtimeConversation } from "./use-realtime-conversation";

interface Item {
  readonly id: string;
  readonly sequence: number;
}

describe("useRealtimeConversation", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not fetch a closed conversation", () => {
    const loadPage = vi.fn();
    const loadFromStart = vi.fn();
    renderHook(() =>
      useRealtimeConversation<Item>({
        applicationId: "application-1",
        active: false,
        getMessages: () => [],
        loadFromStart,
        loadPage,
        applyMessages: vi.fn(),
      }),
    );

    catchUpOpenConversation("application-1");
    expect(loadPage).not.toHaveBeenCalled();
    expect(loadFromStart).not.toHaveBeenCalled();
  });

  it("applies the HTTP page and never a caller-supplied message id", async () => {
    const applyMessages = vi.fn();
    const loadPage = vi.fn().mockResolvedValue({
      messages: [{ id: "from-http", sequence: 2 }],
      hasMore: false,
      nextAfterSequence: null,
    });
    renderHook(() =>
      useRealtimeConversation<Item>({
        applicationId: "application-1",
        active: true,
        getMessages: () => [{ id: "loaded", sequence: 1 }],
        loadFromStart: vi.fn(),
        loadPage,
        applyMessages,
      }),
    );

    catchUpOpenConversation("application-1");
    await waitFor(() => expect(applyMessages).toHaveBeenCalledOnce());
    expect(loadPage).toHaveBeenCalledWith(1, expect.any(AbortSignal));
    expect(applyMessages).toHaveBeenCalledWith([
      { id: "loaded", sequence: 1 },
      { id: "from-http", sequence: 2 },
    ]);
  });

  it("reloads from the start when the open thread has a hole", async () => {
    const loadFromStart = vi.fn().mockResolvedValue([
      { id: "m1", sequence: 1 },
      { id: "m2", sequence: 2 },
    ]);
    const loadPage = vi.fn();
    const applyMessages = vi.fn();
    renderHook(() =>
      useRealtimeConversation<Item>({
        applicationId: "application-1",
        active: true,
        getMessages: () => [
          { id: "m1", sequence: 1 },
          { id: "m3", sequence: 3 },
        ],
        loadFromStart,
        loadPage,
        applyMessages,
      }),
    );

    catchUpOpenConversation("application-1");
    await waitFor(() => expect(applyMessages).toHaveBeenCalledOnce());
    expect(loadPage).not.toHaveBeenCalled();
    expect(applyMessages).toHaveBeenCalledWith([
      { id: "m1", sequence: 1 },
      { id: "m2", sequence: 2 },
    ]);
  });
});
