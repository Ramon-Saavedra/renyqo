import { getCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { clearGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { getRealtimeEpoch, resumeRealtimeConnection } from "./client";

function hasStringKey(
  value: object,
  key: string,
): value is Record<string, unknown> {
  return key in value;
}

function errorDataCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  if (!hasStringKey(error, "data")) return null;
  const data = error.data;
  if (typeof data !== "object" || data === null) return null;
  if (!hasStringKey(data, "code")) return null;
  return typeof data.code === "string" ? data.code : null;
}

export function isAuthRequiredError(error: unknown): boolean {
  return errorDataCode(error) === "AUTH_REQUIRED";
}

function isUnauthenticated(error: unknown): boolean {
  return (
    error instanceof ApiError && error.kind === "http" && error.status === 401
  );
}

let confirmation: { epoch: number; promise: Promise<void> } | null = null;

export function recoverRealtimeSession(): Promise<void> {
  const epoch = getRealtimeEpoch();
  if (confirmation?.epoch === epoch) return confirmation.promise;
  const request = { epoch, promise: Promise.resolve() };
  request.promise = confirmSession(epoch).finally(() => {
    if (confirmation === request) confirmation = null;
  });
  confirmation = request;
  return request.promise;
}

async function confirmSession(epoch: number): Promise<void> {
  try {
    await getCurrentUser();
  } catch (error: unknown) {
    if (epoch !== getRealtimeEpoch()) return;
    if (isUnauthenticated(error)) {
      clearGlobalAttention();
      invalidateCurrentUser();
    }
    return;
  }
  if (epoch !== getRealtimeEpoch()) return;
  resumeRealtimeConnection();
}
