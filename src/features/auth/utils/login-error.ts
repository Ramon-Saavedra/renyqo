import type { AuthErrorCategory } from "./api-error";
import { loginCopy } from "../copy/login";

export function resolveLoginErrorMessage(
  category: AuthErrorCategory,
): string | null {
  switch (category) {
    case "invalid":
      return loginCopy.errors.invalidCredentials;
    case "network":
      return loginCopy.errors.unavailable;
    case "timeout":
      return loginCopy.errors.timeout;
    case "server":
      return loginCopy.errors.server;
    case "cancelled":
      return null;
    case "unexpected":
      return loginCopy.errors.unexpected;
  }
}
