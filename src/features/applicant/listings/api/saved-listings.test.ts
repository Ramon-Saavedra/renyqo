import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import { getSavedListings, SavedListingsContractError } from "./saved-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

function savedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-1",
    title: "Apartment in Berlin",
    city: "Berlin",
    district: "Mitte",
    rooms: 3,
    livingArea: 70,
    coldRent: 1200,
    serviceCharge: 200,
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: true,
    isNew: false,
    publishedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("getSavedListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the saved listings endpoint without query params by default", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });

    await getSavedListings();

    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/applicant/saved-listings",
      undefined,
    );
  });

  it("builds limit and cursor query params", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });

    await getSavedListings({ limit: 20, cursor: "cursor-1" });

    const url = vi.mocked(apiGet).mock.calls[0]?.[0] as string;
    expect(url.startsWith("/api/v1/applicant/saved-listings?")).toBe(true);
    const search = new URL(url, "http://localhost").searchParams;
    expect(search.get("limit")).toBe("20");
    expect(search.get("cursor")).toBe("cursor-1");
    expect(search.has("next_cursor")).toBe(false);
  });

  it("passes AbortSignal when options are provided", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });
    const controller = new AbortController();

    await getSavedListings({}, { signal: controller.signal });

    expect(apiGet).toHaveBeenCalledWith("/api/v1/applicant/saved-listings", {
      signal: controller.signal,
    });
  });

  it("maps items, nextCursor and total from the saved listings contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem()],
      nextCursor: "cursor-abc",
      total: 3,
    });

    const result = await getSavedListings();

    expect(result.listings).toHaveLength(1);
    expect(result.total).toBe(3);
    expect(result.nextCursor).toBe("cursor-abc");
    expect(result.listings[0]?.id).toBe("listing-1");
    expect(result.listings[0]?.isSaved).toBe(true);
    expect(result.listings[0]?.hasApplied).toBe(false);
    expect(result.listings[0]?.applicationStatus).toBeNull();
    expect(result.listings[0]?.publicReason).toBeNull();
  });

  it("rejects an envelope that uses next_cursor instead of nextCursor", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      next_cursor: "cursor-abc",
      total: 0,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects a missing nextCursor field", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      total: 0,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects a missing total field", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item with isSaved false", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem({ isSaved: false })],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item missing isSaved", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "missing-saved",
          title: "Apartment in Berlin",
          city: "Berlin",
          district: "Mitte",
          rooms: 3,
          livingArea: 70,
          coldRent: 1200,
          serviceCharge: 200,
          hasApplied: false,
          applicationStatus: null,
          publicReason: null,
          isNew: false,
          publishedAt: "2026-07-01T10:00:00.000Z",
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects the whole page when one item is not saved", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        savedItem({ id: "ok" }),
        savedItem({ id: "bad", isSaved: false }),
      ],
      nextCursor: null,
      total: 2,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item with a mistyped title", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem({ title: 123 })],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item with a mistyped rent", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem({ coldRent: "1200" })],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item with a mistyped living area", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem({ livingArea: { sqm: 70 } })],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });

  it("rejects an item with a non-boolean isSaved", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [savedItem({ isSaved: "true" })],
      nextCursor: null,
      total: 1,
    });

    await expect(getSavedListings()).rejects.toBeInstanceOf(
      SavedListingsContractError,
    );
  });
});
