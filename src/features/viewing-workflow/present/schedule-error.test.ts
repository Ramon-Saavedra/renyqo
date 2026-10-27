import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiPost } from "@/lib/api/client";
import {
  viewingScheduleErrorCopy,
  viewingScheduleErrorMessage,
} from "./schedule-error";

vi.mock("@/lib/api/csrf", () => ({
  csrfTokenPath: "/api/v1/auth/csrf-token",
  clearCsrfToken: vi.fn(),
  getCsrfToken: vi.fn().mockResolvedValue("test-csrf-token"),
}));

const combined = "Viewing must start in the future and last 5 to 240 minutes";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("viewing schedule error copy", () => {
  it("maps the combined backend validation to one German message", () => {
    const error = new ApiError(400, combined, "http", null, {
      statusCode: 400,
      message: combined,
      error: "Bad Request",
    });
    expect(viewingScheduleErrorMessage(error)).toBe(
      viewingScheduleErrorCopy.futureAndDuration,
    );
  });

  it("maps a future-only backend message", () => {
    const message = "Viewing must start in the future";
    expect(
      viewingScheduleErrorMessage(
        new ApiError(400, message, "http", null, { message }),
      ),
    ).toBe(viewingScheduleErrorCopy.future);
  });

  it("maps a duration-only backend message", () => {
    const message = "Viewing must last 5 to 240 minutes";
    expect(
      viewingScheduleErrorMessage(
        new ApiError(400, message, "http", null, { message }),
      ),
    ).toBe(viewingScheduleErrorCopy.duration);
  });

  it("maps separate backend messages when both conditions are present", () => {
    expect(
      viewingScheduleErrorMessage(
        new ApiError(400, "Viewing must start in the future", "http", null, {
          message: [
            "Viewing must start in the future",
            "Viewing must last 5 to 240 minutes",
          ],
        }),
      ),
    ).toBe(viewingScheduleErrorCopy.futureAndDuration);
  });

  it("maps the 400 body returned by apiPost", async () => {
    const body = {
      message: combined,
      error: "Bad Request",
      statusCode: 400,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(body),
      }),
    );
    const error = await apiPost(
      "/api/v1/provider/applications/application-1/viewing-workflow/invitations",
      {},
    ).then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(viewingScheduleErrorMessage(error)).toBe(
      viewingScheduleErrorCopy.futureAndDuration,
    );
    expect(error).toMatchObject({
      status: 400,
      message: combined,
      details: body,
    });
  });

  it("uses the proposal fallback for an unknown validation error", () => {
    expect(
      viewingScheduleErrorMessage(
        new ApiError(400, "Expected plain text", "http", null, {
          message: "Expected plain text",
        }),
      ),
    ).toBe(viewingScheduleErrorCopy.unknown);
    expect(viewingScheduleErrorMessage(new Error("failed"))).toBe(
      viewingScheduleErrorCopy.unknown,
    );
  });
});
