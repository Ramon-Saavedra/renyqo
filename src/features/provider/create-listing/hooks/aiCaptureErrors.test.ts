import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import {
  aiCaptureErrorMessage,
  classifyAiCaptureError,
} from "./aiCaptureErrors";

describe("classifyAiCaptureError", () => {
  it.each([
    [new ApiError(400, "invalid"), "invalid"],
    [new ApiError(401, "unauthorized"), "unauthorized"],
    [new ApiError(429, "rate limit"), "rateLimit"],
    [new ApiError(0, "network", "network"), "network"],
    [new ApiError(0, "cancelled", "cancelled"), "cancelled"],
  ] as const)("maps %s to %s", (error, expected) => {
    expect(classifyAiCaptureError(error)).toBe(expected);
  });

  it("uses a generic classification for unknown errors", () => {
    expect(classifyAiCaptureError(new Error("failure"))).toBe("generic");
  });
});

describe("aiCaptureErrorMessage", () => {
  it("does not expose the backend message for invalid input", () => {
    expect(aiCaptureErrorMessage("invalid", "pdf")).toContain(
      "nicht verarbeitet",
    );
    expect(aiCaptureErrorMessage("invalid", "pdf")).not.toContain("invalid");
  });
});
