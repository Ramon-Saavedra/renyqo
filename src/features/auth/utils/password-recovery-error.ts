import type { AuthErrorCategory } from "./api-error";
import { passwordRecoveryCopy } from "../copy/password-recovery";

export function resolveForgotPasswordErrorMessage(
  category: AuthErrorCategory,
): string | null {
  switch (category) {
    case "network":
      return passwordRecoveryCopy.forgot.errors.unavailable;
    case "timeout":
      return passwordRecoveryCopy.forgot.errors.timeout;
    case "server":
      return passwordRecoveryCopy.forgot.errors.server;
    case "cancelled":
      return null;
    case "invalid":
    case "unexpected":
      return passwordRecoveryCopy.forgot.errors.unexpected;
  }
}

export function resolveResetPasswordErrorMessage(
  category: AuthErrorCategory,
): string | null {
  switch (category) {
    case "invalid":
      return passwordRecoveryCopy.reset.errors.invalidToken;
    case "network":
      return passwordRecoveryCopy.reset.errors.unavailable;
    case "timeout":
      return passwordRecoveryCopy.reset.errors.timeout;
    case "server":
      return passwordRecoveryCopy.reset.errors.server;
    case "cancelled":
      return null;
    case "unexpected":
      return passwordRecoveryCopy.reset.errors.unexpected;
  }
}
