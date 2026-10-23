import { afterEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => vi.fn());

vi.mock("socket.io-client", () => ({
  io,
}));

import {
  REALTIME_SOCKET_OPTIONS,
  connectRealtime,
  disconnectRealtime,
  realtimeEndpoint,
} from "./client";
import { clearRecentEvents, rememberEvent } from "./recent-events";

interface FakeSocket {
  readonly emit: ReturnType<typeof vi.fn>;
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly removeAllListeners: ReturnType<typeof vi.fn>;
  readonly connected: boolean;
  readonly io: { reconnection: ReturnType<typeof vi.fn> };
  trigger(event: string, ...args: unknown[]): void;
}

function fakeSocket(): FakeSocket {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const socket: FakeSocket = {
    emit: vi.fn(),
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
  io.mockImplementationOnce(() => {
    const recorded = {
      ...socket,
      on(event: string, listener: (...args: unknown[]) => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
        return recorded;
      },
    };
    return recorded;
  });
  return socket;
}

describe("realtime client", () => {
  afterEach(() => {
    disconnectRealtime();
    clearRecentEvents();
    io.mockReset();
  });

  it("opens one websocket socket without auth, query, or client emits", () => {
    const socket = fakeSocket();
    const onDomainEvent = vi.fn();
    connectRealtime({
      onDomainEvent,
      onConnected: vi.fn(),
      onConnectError: vi.fn(),
      onServerDisconnect: vi.fn(),
    });
    connectRealtime({
      onDomainEvent,
      onConnected: vi.fn(),
      onConnectError: vi.fn(),
      onServerDisconnect: vi.fn(),
    });

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      realtimeEndpoint(),
      REALTIME_SOCKET_OPTIONS,
    );
    expect(REALTIME_SOCKET_OPTIONS).toMatchObject({
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      timeout: 20_000,
      multiplex: false,
    });
    expect(REALTIME_SOCKET_OPTIONS).not.toHaveProperty("auth");
    expect(REALTIME_SOCKET_OPTIONS).not.toHaveProperty("query");
    socket.trigger("domain-event", { type: "conversation.message.created" });
    expect(socket.emit).not.toHaveBeenCalled();
    expect(onDomainEvent).toHaveBeenCalledOnce();
  });

  it("forwards only an io server disconnect and clears remembered events", () => {
    const socket = fakeSocket();
    const onServerDisconnect = vi.fn();
    connectRealtime({
      onDomainEvent: vi.fn(),
      onConnected: vi.fn(),
      onConnectError: vi.fn(),
      onServerDisconnect,
    });
    rememberEvent("event-1");
    socket.trigger("disconnect", "transport close");
    expect(onServerDisconnect).not.toHaveBeenCalled();
    socket.trigger("disconnect", "io server disconnect");
    expect(onServerDisconnect).toHaveBeenCalledOnce();
    disconnectRealtime();
    expect(socket.disconnect).toHaveBeenCalledOnce();
    expect(rememberEvent("event-1")).toBe(true);
  });
});
