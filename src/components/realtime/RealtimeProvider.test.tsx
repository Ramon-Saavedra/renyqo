import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, type SafeUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import {
  invalidateCurrentUser,
  setCurrentUser,
} from "@/lib/api/use-current-user";
import { RealtimeProvider } from "./RealtimeProvider";
import {
  REALTIME_COALESCE_MS,
  subscribeConversationAttention,
} from "@/lib/realtime/attention";
import { registerOpenConversation } from "@/lib/realtime/open-conversations";

const env = vi.hoisted(() => ({ enabled: true }));
const io = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({
  API_URL: "http://api.test",
  isRealtimeEnabled: () => env.enabled,
}));

vi.mock("socket.io-client", () => ({
  io,
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  invalidateGlobalAttention: vi.fn(),
  clearGlobalAttention: vi.fn(),
}));

interface FakeSocket {
  emit: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  connected: boolean;
  io: { reconnection: ReturnType<typeof vi.fn> };
  trigger(event: string, ...args: unknown[]): void;
}

const sockets: FakeSocket[] = [];

function createSocket(): FakeSocket {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const socket: FakeSocket = {
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => {
      listeners.clear();
    }),
    connected: false,
    io: { reconnection: vi.fn() },
    trigger(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) listener(...args);
    },
  };
  const recorded = Object.assign(socket, {
    on(event: string, listener: (...args: unknown[]) => void) {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
      return recorded;
    },
  });
  sockets.push(socket);
  return recorded;
}

const applicant: SafeUser = {
  id: "applicant-1",
  name: "Ada",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

const provider: SafeUser = {
  ...applicant,
  id: "provider-1",
  role: "provider",
};

function renderProvider() {
  return render(
    <RealtimeProvider>
      <span>app</span>
    </RealtimeProvider>,
  );
}

describe("RealtimeProvider", () => {
  beforeEach(() => {
    env.enabled = true;
    sockets.length = 0;
    io.mockImplementation(() => createSocket());
    vi.mocked(getCurrentUser).mockResolvedValue(applicant);
  });

  afterEach(() => {
    cleanup();
    act(() => invalidateCurrentUser());
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not connect while loading, anonymous, failed, or disabled", async () => {
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => undefined));
    renderProvider();
    expect(io).not.toHaveBeenCalled();
    cleanup();

    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError(401, "Unauthorized", "http"),
    );
    invalidateCurrentUser();
    renderProvider();
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    expect(io).not.toHaveBeenCalled();
    cleanup();

    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError(500, "down", "http"),
    );
    invalidateCurrentUser();
    renderProvider();
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    expect(io).not.toHaveBeenCalled();
    cleanup();

    env.enabled = false;
    act(() => setCurrentUser(applicant));
    renderProvider();
    expect(io).not.toHaveBeenCalled();
  });

  it("keeps one socket, disconnects on logout, and reconnects for a new user", () => {
    act(() => setCurrentUser(applicant));
    render(
      <StrictMode>
        <RealtimeProvider>
          <span>app</span>
        </RealtimeProvider>
      </StrictMode>,
    );
    expect(screen.getByText("app")).toBeInstanceOf(HTMLElement);
    const live = sockets.filter(
      (socket) => socket.disconnect.mock.calls.length === 0,
    );
    expect(live).toHaveLength(1);
    expect(io.mock.calls.length).toBeGreaterThan(0);
    expect(sockets.length).toBe(io.mock.calls.length);

    act(() => setCurrentUser(provider));
    expect(sockets.at(-1)?.disconnect).not.toHaveBeenCalled();
    expect(sockets.at(-2)?.disconnect).toHaveBeenCalled();

    act(() => invalidateCurrentUser());
    expect(sockets.at(-1)?.disconnect).toHaveBeenCalled();
  });

  it("resyncs on connect and when the tab becomes visible", () => {
    vi.useFakeTimers();
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    act(() => {
      socket?.trigger("connect");
      vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    });
    expect(invalidateGlobalAttention).toHaveBeenCalledWith("applicant");
    vi.mocked(invalidateGlobalAttention).mockClear();

    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    });
    expect(invalidateGlobalAttention).toHaveBeenCalledWith("applicant");
  });

  it("stops on AUTH_REQUIRED and reconnects only when HTTP auth succeeds", async () => {
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    vi.mocked(getCurrentUser).mockResolvedValue(applicant);
    socket?.trigger("connect_error", { data: { code: "AUTH_REQUIRED" } });
    expect(socket?.io.reconnection).toHaveBeenCalledWith(false);
    await waitFor(() => expect(socket?.connect).toHaveBeenCalledOnce());
    expect(socket?.emit).not.toHaveBeenCalled();
  });

  it("leaves the socket closed when AUTH_REQUIRED confirms a logged-out session", async () => {
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError(401, "Unauthorized", "http"),
    );
    socket?.trigger("connect_error", { data: { code: "AUTH_REQUIRED" } });
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    expect(socket?.connect).not.toHaveBeenCalled();
  });

  it("keeps backoff for a generic connect error", () => {
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    socket?.trigger("connect_error", new Error("timeout"));
    expect(socket?.io.reconnection).not.toHaveBeenCalledWith(false);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("verifies HTTP auth before reconnecting after an io server disconnect", async () => {
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    vi.mocked(getCurrentUser).mockResolvedValue(applicant);
    socket?.trigger("disconnect", "transport close");
    expect(getCurrentUser).not.toHaveBeenCalled();
    socket?.trigger("disconnect", "io server disconnect");
    expect(socket?.io.reconnection).toHaveBeenCalledWith(false);
    await waitFor(() => expect(socket?.connect).toHaveBeenCalledOnce());
  });

  it("catch-up for a message and summary refresh for reply and read", () => {
    vi.useFakeTimers();
    const catchUp = vi.fn();
    const notice = vi.fn();
    const unregister = registerOpenConversation("application-1", catchUp);
    const unsubscribe = subscribeConversationAttention(notice);
    act(() => setCurrentUser(applicant));
    renderProvider();
    const socket = sockets.at(-1);
    const base = {
      schemaVersion: 1,
      occurredAt: "2026-10-22T08:00:00.000Z",
      applicationId: "application-1",
      conversationId: "conversation-1",
    };

    act(() => {
      socket?.trigger("domain-event", {
        ...base,
        eventId: "event-1",
        type: "conversation.message.created",
        payload: { messageId: "message-1", messageSequence: 4 },
      });
      socket?.trigger("domain-event", {
        ...base,
        eventId: "event-1",
        type: "conversation.message.created",
        payload: { messageId: "message-1", messageSequence: 4 },
      });
      vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    });

    expect(catchUp).toHaveBeenCalledOnce();
    expect(invalidateGlobalAttention).toHaveBeenCalledWith("applicant");
    expect(socket?.emit).not.toHaveBeenCalled();

    catchUp.mockClear();
    act(() => {
      socket?.trigger("domain-event", {
        ...base,
        eventId: "event-2",
        type: "conversation.reply-permission.changed",
        payload: { enabled: false },
      });
      socket?.trigger("domain-event", {
        ...base,
        eventId: "event-3",
        type: "conversation.read.advanced",
        payload: {
          readerSide: "PROVIDER",
          throughSequence: 4,
          markedCount: 3,
        },
      });
      vi.advanceTimersByTime(REALTIME_COALESCE_MS);
    });

    expect(catchUp).not.toHaveBeenCalled();
    expect(notice).toHaveBeenLastCalledWith({
      refreshLists: true,
      refreshAllSummaries: false,
      summaryApplicationIds: ["application-1"],
    });
    unregister();
    unsubscribe();
  });
});
