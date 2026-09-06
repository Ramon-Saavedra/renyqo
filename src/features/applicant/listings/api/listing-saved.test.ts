import { describe, expect, it, vi } from "vitest";
import { apiDelete, apiPut } from "@/lib/api/client";
import { saveListing, unsaveListing } from "./listing-saved";

vi.mock("@/lib/api/client", () => ({
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

const saved = {
  saved: true as const,
  savedAt: "2026-09-05T12:00:00.000Z",
};

const unsaved = {
  saved: false as const,
  savedAt: null,
};

describe("saveListing", () => {
  it("PUTs the saved listing endpoint without a body", async () => {
    vi.mocked(apiPut).mockResolvedValue(saved);

    await expect(saveListing("a b")).resolves.toEqual(saved);
    expect(apiPut).toHaveBeenCalledWith(
      "/api/v1/applicant/listings/a%20b/saved",
    );
  });

  it("rejects a response that is not saved", async () => {
    vi.mocked(apiPut).mockResolvedValue(unsaved);
    await expect(saveListing("listing-1")).rejects.toThrow(
      "Invalid saved listing response",
    );
  });
});

describe("unsaveListing", () => {
  it("DELETEs the saved listing endpoint", async () => {
    vi.mocked(apiDelete).mockResolvedValue(unsaved);

    await expect(unsaveListing("a b")).resolves.toEqual(unsaved);
    expect(apiDelete).toHaveBeenCalledWith(
      "/api/v1/applicant/listings/a%20b/saved",
    );
  });

  it("rejects a response that is still saved", async () => {
    vi.mocked(apiDelete).mockResolvedValue(saved);
    await expect(unsaveListing("listing-1")).rejects.toThrow(
      "Invalid saved listing response",
    );
  });
});
