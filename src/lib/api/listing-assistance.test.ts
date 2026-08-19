import { describe, expect, it, vi } from "vitest";

import { apiPost } from "./client";
import { extractListingFromText } from "./listing-assistance";

vi.mock("./client", () => ({
  apiPost: vi.fn(),
  apiPostFormData: vi.fn(),
}));

describe("extractListingFromText", () => {
  it("returns a validated extraction result", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      values: { city: "Berlin" },
      missingFields: [],
      inconsistencies: [],
      warnings: [],
    });

    await expect(extractListingFromText("Wohnung in Berlin")).resolves.toEqual(
      expect.objectContaining({ values: { city: "Berlin" } }),
    );
  });

  it("rejects malformed extraction results", async () => {
    vi.mocked(apiPost).mockResolvedValue({ values: { city: 42 } });

    await expect(extractListingFromText("Wohnung")).rejects.toThrow();
  });
});
