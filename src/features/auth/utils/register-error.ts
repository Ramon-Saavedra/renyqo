import { ApiError } from "@/lib/api/client";
import { createAccountCopy } from "../copy/create-account";

export function resolveRegistrationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return createAccountCopy.globalErrors.unknown;
  if (error.kind === "timeout") return createAccountCopy.globalErrors.timeout;
  if (error.kind === "network" || error.status === 0) {
    return createAccountCopy.globalErrors.unavailable;
  }
  if (error.status === 429) return createAccountCopy.globalErrors.rateLimited;
  if (error.status === 400 || error.status === 422) {
    return createAccountCopy.globalErrors.validation;
  }
  if (error.status >= 500) return createAccountCopy.globalErrors.server;
  return createAccountCopy.globalErrors.unknown;
}
