export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function isRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REALTIME_ENABLED === "true";
}
