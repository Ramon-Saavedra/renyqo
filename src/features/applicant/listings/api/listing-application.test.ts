import { describe, expect, it, vi } from "vitest";
import { ApiError, apiPost } from "@/lib/api/client";
import { applyToListing, ListingEligibilityRejectedError } from "./listing-application";

vi.mock("@/lib/api/client", () => ({
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly details: unknown;
    constructor(status: number, message: string, _kind?: string, _code?: string | null, details: unknown = null) {
      super(message);
      this.status = status;
      this.details = details;
    }
  },
  apiPost: vi.fn(),
}));

const application = {
  id: "application-1",
  listingId: "listing-1",
  applicantId: "applicant-1",
  status: "ACTIVE",
  rejectedAt: null,
  publicReason: null,
  createdAt: "2026-08-23T10:00:00.000Z",
  updatedAt: "2026-08-23T10:00:00.000Z",
};

describe("applyToListing", () => {
  it.each(["ACTIVE", "WAITING"] as const)("returns backend %s status", async (status) => {
    vi.mocked(apiPost).mockResolvedValue({ ...application, status });
    await expect(applyToListing("listing-1")).resolves.toMatchObject({ status });
  });

  it("preserves duplicate, not-found and auth API errors", async () => {
    for (const status of [409, 404, 401, 403]) {
      const error = new ApiError(status, "error");
      vi.mocked(apiPost).mockRejectedValueOnce(error);
      await expect(applyToListing("listing-1")).rejects.toBe(error);
    }
  });

  it("maps a 422 eligibility rejection", async () => {
    vi.mocked(apiPost).mockRejectedValue(
      new ApiError(422, "Applicant is not eligible for this listing", "http", null, {
        canApply: false,
        reasons: ["pets_not_allowed"],
        warnings: [],
        evaluatedAt: "2026-08-23T10:00:00.000Z",
      }),
    );
    await expect(applyToListing("listing-1")).rejects.toBeInstanceOf(
      ListingEligibilityRejectedError,
    );
  });

  it("rejects malformed success payloads", async () => {
    vi.mocked(apiPost).mockResolvedValue({ ...application, status: "REJECTED" });
    await expect(applyToListing("listing-1")).rejects.toThrow(
      "Invalid listing application response",
    );
  });
});
