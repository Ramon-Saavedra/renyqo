import { API_URL } from "@/lib/env";
import { z } from "zod";

const CSRF_PATH = "/api/v1/auth/csrf-token";
const csrfResponseSchema = z.object({ csrfToken: z.string().min(1) });

let csrfToken: string | null = null;
let pendingRequest: Promise<string> | null = null;

async function requestCsrfToken(): Promise<string> {
  const response = await fetch(`${API_URL}${CSRF_PATH}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("CSRF token request failed");
  const payload = csrfResponseSchema.parse(await response.json());
  csrfToken = payload.csrfToken;
  return payload.csrfToken;
}

export function getCsrfToken(force = false): Promise<string> {
  if (!force && csrfToken) return Promise.resolve(csrfToken);
  if (!force && pendingRequest) return pendingRequest;
  pendingRequest = requestCsrfToken().finally(() => {
    pendingRequest = null;
  });
  return pendingRequest;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

export const csrfTokenPath = CSRF_PATH;
