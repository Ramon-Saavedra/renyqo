import { describe, expect, it, vi } from "vitest";
import { apiDelete } from "@/lib/api/client";
import { withdrawListingApplication } from "./listing-withdrawal";

vi.mock("@/lib/api/client", () => ({ apiDelete: vi.fn() }));

const withdrawn = { id: "a", listingId: "l", status: "WITHDRAWN", rejectedAt: null, publicReason: null, createdAt: "2026-08-23T10:00:00.000Z", updatedAt: "2026-08-23T10:00:00.000Z" };

describe("withdrawListingApplication", () => {
  it("uses the applicant withdrawal endpoint", async () => {
    vi.mocked(apiDelete).mockResolvedValue(withdrawn);
    await expect(withdrawListingApplication("a b")).resolves.toEqual(withdrawn);
    expect(apiDelete).toHaveBeenCalledWith("/api/v1/applicant/applications/a%20b");
  });

  it("rejects a response that is not WITHDRAWN", async () => {
    vi.mocked(apiDelete).mockResolvedValue({ ...withdrawn, status: "ACTIVE" });
    await expect(withdrawListingApplication("a")).rejects.toThrow("Invalid listing withdrawal response");
  });
});
