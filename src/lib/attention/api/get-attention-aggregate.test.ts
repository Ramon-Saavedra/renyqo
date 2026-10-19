import { apiGet } from "@/lib/api/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  AttentionAggregateContractError,
  getAttentionAggregate,
} from "./get-attention-aggregate";
import {
  emptyApplicationAttentionSummary,
  emptyAttentionTotals,
} from "../fixtures";

vi.mock("@/lib/api/client", () => ({ apiGet: vi.fn() }));

const validPayload = {
  asOf: "2026-01-01T00:00:00.000Z",
  totals: emptyAttentionTotals(),
  listings: [],
  items: [],
  pagination: {
    offset: 0,
    limit: 20,
    totalApplications: 0,
    hasMore: false,
  },
};

describe("getAttentionAggregate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the applicant attention endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(validPayload);

    await getAttentionAggregate("applicant");

    expect(apiGet).toHaveBeenCalledWith("/api/v1/applicant/attention");
  });

  it("calls the provider attention endpoint", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(validPayload);

    await getAttentionAggregate("provider");

    expect(apiGet).toHaveBeenCalledWith("/api/v1/provider/attention");
  });

  it("passes pagination query params", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(validPayload);

    await getAttentionAggregate("applicant", { limit: 10, offset: 5 });

    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/applicant/attention?limit=10&offset=5",
    );
  });

  it("rejects invalid contract payloads", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ invalid: true });

    await expect(getAttentionAggregate("applicant")).rejects.toBeInstanceOf(
      AttentionAggregateContractError,
    );
  });

  it.each(["applicant", "provider"] as const)(
    "requests actionable attention for %s",
    async (role) => {
      vi.mocked(apiGet).mockResolvedValueOnce(validPayload);
      await getAttentionAggregate(role, {
        filter: "actionable",
        limit: 20,
        offset: 20,
      });
      expect(apiGet).toHaveBeenCalledWith(
        `/api/v1/${role}/attention?filter=actionable&limit=20&offset=20`,
      );
    },
  );

  it("parses listing display fields on attention items", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      ...validPayload,
      items: [
        {
          ...emptyApplicationAttentionSummary(),
          applicationId: "app-1",
          listingId: "listing-1",
          listingTitle: "Wohnung Mitte",
          listingCity: "Berlin",
        },
      ],
    });

    const result = await getAttentionAggregate("applicant");
    expect(result.items[0]?.listingTitle).toBe("Wohnung Mitte");
    expect(result.items[0]?.listingCity).toBe("Berlin");
  });
});
