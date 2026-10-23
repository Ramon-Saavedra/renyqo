import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/env";
import { clearRecentEvents } from "./recent-events";

const websocketTransports: string[] = ["websocket"];

export const REALTIME_SOCKET_OPTIONS = {
  path: "/socket.io",
  transports: websocketTransports,
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 30_000,
  randomizationFactor: 0.5,
  timeout: 20_000,
  multiplex: false,
};

export function realtimeEndpoint(apiOrigin: string = API_URL): string {
  return `${apiOrigin}/realtime`;
}

export interface RealtimeHandlers {
  readonly onDomainEvent: (payload: unknown) => void;
  readonly onConnected: () => void;
  readonly onConnectError: (error: unknown) => void;
  readonly onServerDisconnect: () => void;
}

let epoch = 0;
let socket: Socket | null = null;
let reconnectionPaused = false;

export function getRealtimeEpoch(): number {
  return epoch;
}

export function isRealtimeReconnectionPaused(): boolean {
  return reconnectionPaused;
}

export function connectRealtime(handlers: RealtimeHandlers): void {
  if (socket) return;
  epoch += 1;
  const current = epoch;
  reconnectionPaused = false;
  const next = io(realtimeEndpoint(), REALTIME_SOCKET_OPTIONS);
  socket = next;

  next.on("domain-event", (payload: unknown) => {
    if (current !== epoch) return;
    handlers.onDomainEvent(payload);
  });
  next.on("connect", () => {
    if (current !== epoch) return;
    handlers.onConnected();
  });
  next.on("connect_error", (error: unknown) => {
    if (current !== epoch) return;
    handlers.onConnectError(error);
  });
  next.on("disconnect", (reason: string) => {
    if (current !== epoch) return;
    if (reason === "io server disconnect") handlers.onServerDisconnect();
  });
}

export function pauseRealtimeReconnection(): void {
  reconnectionPaused = true;
  socket?.io.reconnection(false);
}

export function resumeRealtimeConnection(): void {
  reconnectionPaused = false;
  if (!socket) return;
  socket.io.reconnection(true);
  if (!socket.connected) socket.connect();
}

export function disconnectRealtime(): void {
  epoch += 1;
  reconnectionPaused = false;
  clearRecentEvents();
  const current = socket;
  socket = null;
  if (!current) return;
  current.removeAllListeners();
  current.disconnect();
}
