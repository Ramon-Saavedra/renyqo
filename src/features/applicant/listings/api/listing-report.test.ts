import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/lib/api/client";
import { buildListingReportPayload, reportListing } from "./listing-report";

vi.mock("@/lib/api/client", () => ({
  apiPost: vi.fn(),
}));

const created = {
  id: "report-1",
  listingId: "listing-1",
  reason: "MISLEADING_INFO" as const,
  createdAt: "2026-09-06T10:00:00.000Z",
};

describe("buildListingReportPayload", () => {
  it("omits empty and whitespace-only detail", () => {
    expect(buildListingReportPayload("SCAM_OR_FRAUD", "")).toEqual({
      ok: true,
      payload: { reason: "SCAM_OR_FRAUD" },
    });
    expect(buildListingReportPayload("SCAM_OR_FRAUD", "   ")).toEqual({
      ok: true,
      payload: { reason: "SCAM_OR_FRAUD" },
    });
  });

  it("trims optional detail and keeps it when present", () => {
    expect(buildListingReportPayload("DISCRIMINATION", "  unklar  ")).toEqual({
      ok: true,
      payload: { reason: "DISCRIMINATION", detail: "unklar" },
    });
  });

  it("requires a non-empty detail for OTHER", () => {
    expect(buildListingReportPayload("OTHER", "")).toEqual({
      ok: false,
      code: "detail-required",
    });
    expect(buildListingReportPayload("OTHER", "\n  \t")).toEqual({
      ok: false,
      code: "detail-required",
    });
  });

  it("accepts a trimmed OTHER detail", () => {
    expect(buildListingReportPayload("OTHER", "  kein Foto  ")).toEqual({
      ok: true,
      payload: { reason: "OTHER", detail: "kein Foto" },
    });
  });

  it("rejects detail longer than 500 characters", () => {
    expect(
      buildListingReportPayload("MISLEADING_INFO", "a".repeat(501)),
    ).toEqual({
      ok: false,
      code: "detail-too-long",
    });
  });
});

describe("reportListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs the report payload and returns the parsed 201 body", async () => {
    vi.mocked(apiPost).mockResolvedValue(created);
    const payload = { reason: "MISLEADING_INFO" as const };

    await expect(reportListing("a b", payload)).resolves.toEqual(created);
    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/applicant/listings/a%20b/report",
      payload,
    );
  });

  it("does not expose unknown reporter fields from the response", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      ...created,
      reporterId: "hidden",
    });

    await expect(
      reportListing("listing-1", { reason: "MISLEADING_INFO" }),
    ).resolves.toEqual(created);
  });

  it("rejects a malformed success payload", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      ...created,
      reason: "UNKNOWN",
    });

    await expect(
      reportListing("listing-1", { reason: "MISLEADING_INFO" }),
    ).rejects.toThrow("Invalid listing report response");
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("does not POST OTHER without required detail", async () => {
    await expect(
      reportListing("listing-1", { reason: "OTHER" }),
    ).rejects.toThrow("Invalid listing report response");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("does not POST OTHER with whitespace-only detail", async () => {
    await expect(
      reportListing("listing-1", { reason: "OTHER", detail: "   " }),
    ).rejects.toThrow("Invalid listing report response");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("does not POST an invalid outbound payload", async () => {
    await expect(
      reportListing("listing-1", {
        reason: "MISLEADING_INFO",
        detail: "",
      }),
    ).rejects.toThrow("Invalid listing report response");
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("sends only validated payload fields", async () => {
    vi.mocked(apiPost).mockResolvedValue(created);

    await expect(
      reportListing("listing-1", {
        reason: "MISLEADING_INFO",
        detail: "hinweis",
      }),
    ).resolves.toEqual(created);

    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/applicant/listings/listing-1/report",
      { reason: "MISLEADING_INFO", detail: "hinweis" },
    );
  });
});
