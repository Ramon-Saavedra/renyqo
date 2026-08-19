import { ApiError } from "@/lib/api/client";
import { createListingCopy } from "../copy/create-listing";
import type { AiCaptureErrorKind, AiCaptureMode } from "./useAiCapture";

const copy = createListingCopy.aiCapture;

export function classifyAiCaptureError(error: unknown): AiCaptureErrorKind {
  if (!(error instanceof ApiError)) return "generic";
  if (error.kind === "cancelled") return "cancelled";
  if (error.kind === "network" || error.kind === "timeout") return "network";
  if (error.status === 429) return "rateLimit";
  if (error.status === 401) return "unauthorized";
  if (error.status === 400) return "invalid";
  return "generic";
}

export function aiCaptureErrorMessage(
  kind: AiCaptureErrorKind,
  mode: AiCaptureMode,
): string {
  if (kind === "rateLimit") return copy.error.rateLimitBody;
  if (kind === "unauthorized") return copy.error.unauthorizedBody;
  if (kind === "network") return copy.error.networkBody;
  if (kind === "invalid") return copy.error.invalidBody;
  if (kind === "cancelled") return copy.error.genericBody;
  return mode === "pdf" ? copy.pdf.errors.invalidType : copy.error.genericBody;
}
