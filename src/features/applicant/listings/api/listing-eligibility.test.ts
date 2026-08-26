import { describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api/client";
import { getListingEligibility } from "./listing-eligibility";

vi.mock("@/lib/api/client", () => ({ apiGet: vi.fn() }));

const response = {
  canApply: false,
  reasons: ["smoking_not_allowed"],
  warnings: ["smoking_by_arrangement"],
  evaluatedAt: "2026-08-23T10:00:00.000Z",
};

describe("getListingEligibility", () => {
  it("validates and returns the backend result", async () => {
    vi.mocked(apiGet).mockResolvedValue(response);
    await expect(getListingEligibility("a b")).resolves.toEqual(response);
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/listings/a%20b/eligibility",
      undefined,
    );
  });

  it("rejects an invalid contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({ ...response, warnings: ["invalid"] });
    await expect(getListingEligibility("a")).rejects.toThrow(
      "Invalid listing eligibility response",
    );
  });
});
