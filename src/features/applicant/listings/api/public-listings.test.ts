import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import {
  getPublicListingDetail,
  getPublicListings,
} from "./public-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

describe("getPublicListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the public listings endpoint without query params when no filters are set", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], nextCursor: null, total: 0 });

    await getPublicListings({});

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings", undefined);
  });

  it("builds query params from filter values", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], nextCursor: null, total: 0 });

    await getPublicListings({
      query: "Freiburg",
      maxRent: 900,
      minRooms: 2,
      minLivingArea: 40,
      availableBy: "2026-09-01",
      onlyMatching: true,
      sort: "price-asc",
      cursor: "cursor-1",
      limit: 10,
    });

    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/listings?"),
      undefined,
    );

    const url = vi.mocked(apiGet).mock.calls[0]?.[0] as string;
    const search = new URL(url, "http://localhost").searchParams;
    expect(search.get("query")).toBe("Freiburg");
    expect(search.get("maxRent")).toBe("900");
    expect(search.get("minRooms")).toBe("2");
    expect(search.get("minLivingArea")).toBe("40");
    expect(search.get("availableBy")).toBe("2026-09-01");
    expect(search.get("onlyMatching")).toBe("true");
    expect(search.get("sort")).toBe("price-asc");
    expect(search.get("cursor")).toBe("cursor-1");
    expect(search.get("limit")).toBe("10");
  });

  it("omits null and undefined filter values", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], nextCursor: null, total: 0 });

    await getPublicListings({
      maxRent: null,
      minRooms: undefined,
      onlyMatching: false,
    });

    const url = vi.mocked(apiGet).mock.calls[0]?.[0] as string;
    const search = new URL(url, "http://localhost").searchParams;
    expect(search.has("maxRent")).toBe(false);
    expect(search.has("minRooms")).toBe(false);
    expect(search.has("onlyMatching")).toBe(false);
  });

  it("passes AbortSignal when options are provided", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    const controller = new AbortController();

    await getPublicListings({}, { signal: controller.signal });

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings", {
      signal: controller.signal,
    });
  });

  it("maps the standard backend response structure", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "listing-1",
          title: "Apartment in Berlin",
          city: "Berlin",
          district: "Mitte",
          rooms: 3,
          livingArea: 70,
          coldRent: 1200,
          serviceCharge: 200,
          coverImage: {
            secureUrl: "https://res.cloudinary.com/example/apartment.jpg",
          },
          isNew: true,
          publishedAt: "2026-07-01T10:00:00.000Z",
        },
      ],
      nextCursor: "cursor-abc",
      total: 42,
    });

    const result = await getPublicListings({});

    expect(result.listings).toHaveLength(1);
    expect(result.total).toBe(42);
    expect(result.nextCursor).toBe("cursor-abc");

    const listing = result.listings[0];
    expect(listing).toBeDefined();
    expect(listing?.id).toBe("listing-1");
    expect(listing?.title).toBe("Apartment in Berlin");
    expect(listing?.location).toBe("Berlin, Mitte");
    expect(listing?.rooms).toBe(3);
    expect(listing?.livingArea).toBe(70);
    expect(listing?.coldRent).toBe(1200);
    expect(listing?.serviceCharge).toBe(200);
    expect(listing?.coverImageUrl).toBe(
      "https://res.cloudinary.com/example/apartment.jpg",
    );
    expect(listing?.isNew).toBe(true);
    expect(listing?.publishedAt).toBe("2026-07-01T10:00:00.000Z");
  });

  it("maps coverImage.secureUrl and handles null coverImage", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "a",
          coverImage: { secureUrl: "https://res.cloudinary.com/a.jpg" },
        },
        { id: "b", coverImage: null },
      ],
      nextCursor: null,
      total: 2,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.coverImageUrl).toBe(
      "https://res.cloudinary.com/a.jpg",
    );
    expect(listings[1]?.coverImageUrl).toBeNull();
  });

  it("normalizes profileMatch values", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { id: "match", profileMatch: "MATCH" },
        { id: "no-match", profileMatch: "NO_MATCH" },
        { id: "incomplete", profileMatch: "PROFILE_INCOMPLETE" },
        { id: "unknown", profileMatch: "UNKNOWN" },
        { id: "absent" },
      ],
      nextCursor: null,
      total: 5,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.matchesProfile).toBe(true);
    expect(listings[1]?.matchesProfile).toBe(false);
    expect(listings[2]?.matchesProfile).toBeNull();
    expect(listings[3]?.matchesProfile).toBeNull();
    expect(listings[4]?.matchesProfile).toBeNull();
  });

  it("falls back to defaults for missing fields", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "minimal" }],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    const listing = listings[0];
    expect(listing?.title).toBe("Unbenanntes Objekt");
    expect(listing?.rooms).toBe(0);
    expect(listing?.coldRent).toBe(0);
    expect(listing?.coverImageUrl).toBeNull();
    expect(listing?.isNew).toBe(false);
  });

  it("builds location from city and district when displayAddress is absent", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "x", city: "Berlin", district: "Mitte" }],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.location).toBe("Berlin, Mitte");
  });

  it("prefers displayAddress over city+district", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "x",
          displayAddress: "Musterstraße 1, Berlin",
          city: "Berlin",
        },
      ],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.location).toBe("Musterstraße 1, Berlin");
  });

  it("skips rows without an id", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ title: "no-id" }, { id: "valid" }],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    expect(listings).toHaveLength(1);
    expect(listings[0]?.id).toBe("valid");
  });

  it("reads listings from data and listings wrappers", async () => {
    for (const wrapper of ["data", "listings"]) {
      vi.mocked(apiGet).mockResolvedValue({
        [wrapper]: [{ id: wrapper }],
        nextCursor: null,
        total: 1,
      });

      const { listings } = await getPublicListings({});
      expect(listings).toHaveLength(1);
      expect(listings[0]?.id).toBe(wrapper);
    }
  });

  it("handles response with total from alternative keys", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalResults: 99,
    });

    const { total } = await getPublicListings({});
    expect(total).toBe(99);
  });

  it("handles nextCursor from alternative keys", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      next_cursor: "alt-cursor",
      total: 0,
    });

    const { nextCursor } = await getPublicListings({});
    expect(nextCursor).toBe("alt-cursor");
  });
});

describe("getPublicListingDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the detail endpoint with an encoded id", async () => {
    vi.mocked(apiGet).mockResolvedValue({ id: "abc" });

    await getPublicListingDetail("abc-123");

    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/listings/abc-123",
      undefined,
    );
  });

  it("maps a single listing record", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      id: "detail-1",
      title: "Einzelwohnung",
      city: "Köln",
    });

    const listing = await getPublicListingDetail("detail-1");
    expect(listing?.id).toBe("detail-1");
    expect(listing?.title).toBe("Einzelwohnung");
  });

  it("returns null for a non-record response", async () => {
    vi.mocked(apiGet).mockResolvedValue("not a record");

    const result = await getPublicListingDetail("x");
    expect(result).toBeNull();
  });

  it("passes AbortSignal when options are provided", async () => {
    vi.mocked(apiGet).mockResolvedValue({ id: "x" });
    const controller = new AbortController();

    await getPublicListingDetail("x", { signal: controller.signal });

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings/x", {
      signal: controller.signal,
    });
  });
});
