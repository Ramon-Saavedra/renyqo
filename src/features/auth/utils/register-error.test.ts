import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import { createAccountCopy } from "../copy/create-account";
import { resolveRegistrationErrorMessage } from "./register-error";

describe("resolveRegistrationErrorMessage", () => {
  it("distinguishes timeouts from network failures", () => {
    expect(
      resolveRegistrationErrorMessage(new ApiError(0, "timeout", "timeout")),
    ).toBe(createAccountCopy.globalErrors.timeout);
    expect(
      resolveRegistrationErrorMessage(new ApiError(0, "network", "network")),
    ).toBe(createAccountCopy.globalErrors.unavailable);
  });

  it.each([
    [400, createAccountCopy.globalErrors.validation],
    [422, createAccountCopy.globalErrors.validation],
    [429, createAccountCopy.globalErrors.rateLimited],
    [500, createAccountCopy.globalErrors.server],
  ])("maps HTTP status %s to the appropriate message", (status, message) => {
    expect(resolveRegistrationErrorMessage(new ApiError(status, "error"))).toBe(
      message,
    );
  });

  it("uses the unknown message for unexpected errors", () => {
    expect(resolveRegistrationErrorMessage(new Error("unexpected"))).toBe(
      createAccountCopy.globalErrors.unknown,
    );
  });
});
