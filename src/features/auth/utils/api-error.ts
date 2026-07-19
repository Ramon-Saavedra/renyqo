import { ApiError } from "@/lib/api/client";

export type AuthErrorCategory =
  | "cancelled"
  | "invalid"
  | "network"
  | "server"
  | "timeout"
  | "unexpected";

export function resolveAuthErrorCategory(error: unknown): AuthErrorCategory {
  if (!(error instanceof ApiError)) return "unexpected";
  if (error.kind === "cancelled") return "cancelled";
  if (error.kind === "network") return "network";
  if (error.kind === "timeout") return "timeout";
  if (error.status === 0) return "network";
  if (
    error.status === 400 ||
    error.status === 401 ||
    error.status === 409 ||
    error.status === 410 ||
    error.status === 422
  ) {
    return "invalid";
  }
  if (error.status >= 500) return "server";
  return "unexpected";
}
