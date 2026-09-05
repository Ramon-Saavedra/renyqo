import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import { getPublicListingDetail, getPublicListings } from "./public-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

describe("getPublicListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the public listings endpoint without query params when no filters are set", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });

    await getPublicListings({});

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings", undefined);
  });

  it("builds query params from filter values", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });

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
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });

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
    vi.mocked(apiGet).mockResolvedValue({
      items: [],
      nextCursor: null,
      total: 0,
    });
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
          hasApplied: false,
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
    expect(listing?.hasApplied).toBe(false);
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
          hasApplied: false,
          coverImage: { secureUrl: "https://res.cloudinary.com/a.jpg" },
        },
        { id: "b", hasApplied: true, coverImage: null },
      ],
      nextCursor: null,
      total: 2,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.coverImageUrl).toBe("https://res.cloudinary.com/a.jpg");
    expect(listings[0]?.hasApplied).toBe(false);
    expect(listings[1]?.coverImageUrl).toBeNull();
    expect(listings[1]?.hasApplied).toBe(true);
  });

  it("normalizes listing profileMatch values", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { id: "match", hasApplied: false, profileMatch: "MATCH" },
        { id: "no-match", hasApplied: false, profileMatch: "NO_MATCH" },
        {
          id: "incomplete",
          hasApplied: false,
          profileMatch: "PROFILE_INCOMPLETE",
        },
        { id: "unknown", hasApplied: false, profileMatch: "UNKNOWN" },
        { id: "absent", hasApplied: false },
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

  it("maps hasApplied from the listing summary contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { id: "applied", hasApplied: true },
        { id: "open", hasApplied: false },
      ],
      nextCursor: null,
      total: 2,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.hasApplied).toBe(true);
    expect(listings[1]?.hasApplied).toBe(false);
  });

  it("rejects a listing summary missing hasApplied", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "missing-applied" }],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects a listing summary with a non-boolean hasApplied", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "bad-applied", hasApplied: "yes" }],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it.each([null, 0, 1] as const)(
    "rejects a listing summary when hasApplied is %s",
    async (hasApplied) => {
      vi.mocked(apiGet).mockResolvedValue({
        items: [{ id: "bad-applied", hasApplied }],
        nextCursor: null,
        total: 1,
      });

      await expect(getPublicListings({})).rejects.toThrow(
        "Invalid public listings response",
      );
    },
  );

  it("falls back to defaults for missing fields", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "minimal", hasApplied: false }],
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
    expect(listing?.hasApplied).toBe(false);
  });

  it("builds location from city and district when displayAddress is absent", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { id: "x", hasApplied: false, city: "Berlin", district: "Mitte" },
      ],
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
          hasApplied: false,
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
      items: [{ title: "no-id" }, { id: "valid", hasApplied: false }],
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
        [wrapper]: [{ id: wrapper, hasApplied: false }],
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

  function detailResponse(overrides: Record<string, unknown> = {}) {
    return {
      id: "detail-1",
      title: "Einzelwohnung",
      city: "Köln",
      zip: "50667",
      district: "Altstadt-Nord",
      street: null,
      objectType: "APARTMENT",
      livingArea: 65,
      rooms: 2,
      bedrooms: 1,
      coldRent: 900,
      additionalCosts: 120,
      deposit: 1800,
      depositMonths: 2,
      availableFrom: "2026-09-01",
      shortDescription: "Helle Wohnung",
      publishedAt: "2026-08-01",
      isNew: true,
      images: [],
      profileMatch: "MATCH",
      requirements: {
        minimumHouseholdNetIncome: null,
        schufaRequired: true,
        incomeProofRequired: true,
        suitableForPeopleCount: null,
        petsPolicy: null,
        smokingPolicy: null,
      },
      ...overrides,
    };
  }

  it("calls the detail endpoint with an encoded id", async () => {
    vi.mocked(apiGet).mockResolvedValue(detailResponse());

    await getPublicListingDetail("abc-123");

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings/abc-123", undefined);
  });

  it("maps a single listing record", async () => {
    vi.mocked(apiGet).mockResolvedValue(detailResponse());

    const listing = await getPublicListingDetail("detail-1");
    expect(listing?.id).toBe("detail-1");
    expect(listing?.title).toBe("Einzelwohnung");
  });

  it.each([
    ["MATCH", "match"],
    ["NO_MATCH", "no-match"],
    ["PROFILE_INCOMPLETE", "incomplete"],
    ["UNKNOWN", "unknown"],
  ] as const)("maps detail profileMatch %s", async (profileMatch, expected) => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({ id: "detail-match", profileMatch }),
    );

    const listing = await getPublicListingDetail("detail-match");

    expect(listing?.matchesProfile).toBe(expected);
  });

  it("rejects a malformed detail response", async () => {
    vi.mocked(apiGet).mockResolvedValue("not a record");

    await expect(getPublicListingDetail("x")).rejects.toThrow(
      "Invalid applicant listing detail response",
    );
  });

  it.each([
    ["requirements", undefined],
    ["schufaRequired", null],
    ["incomeProofRequired", "true"],
  ] as const)(
    "rejects a missing or malformed required %s",
    async (key, value) => {
      const requirements = {
        minimumHouseholdNetIncome: null,
        schufaRequired: true,
        incomeProofRequired: true,
        suitableForPeopleCount: null,
        petsPolicy: null,
        smokingPolicy: null,
      };

      vi.mocked(apiGet).mockResolvedValue(
        key === "requirements"
          ? { ...detailResponse(), requirements: value }
          : detailResponse({ requirements: { ...requirements, [key]: value } }),
      );

      await expect(getPublicListingDetail("detail-invalid")).rejects.toThrow(
        "Invalid applicant listing detail response",
      );
    },
  );

  it("rejects an invalid profileMatch instead of treating it as UNKNOWN", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({ profileMatch: "UNRECOGNIZED" }),
    );

    await expect(
      getPublicListingDetail("detail-invalid-match"),
    ).rejects.toThrow("Invalid applicant listing detail response");
  });

  it.each([
    ["petsPolicy", "PREFER_NOT"],
    ["smokingPolicy", "NON_SMOKERS_PREFERRED"],
  ] as const)("rejects an invalid %s enum value", async (key, value) => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({
        requirements: {
          minimumHouseholdNetIncome: null,
          schufaRequired: true,
          incomeProofRequired: true,
          suitableForPeopleCount: null,
          petsPolicy: null,
          smokingPolicy: null,
          [key]: value,
        },
      }),
    );

    await expect(
      getPublicListingDetail("detail-invalid-policy"),
    ).rejects.toThrow("Invalid applicant listing detail response");
  });

  it("maps the nested requirements object the API returns", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({
        id: "detail-2",
        title: "Haus in Maracaibo",
        street: "Calle 7",
        city: "Maracaibo",
        district: "El Milagro",
        zip: "2001",
        objectType: "HOUSE",
        rooms: 4.5,
        bedrooms: 2,
        livingArea: 120,
        shortDescription: "Helles Haus",
        requirements: {
          minimumHouseholdNetIncome: 3000,
          schufaRequired: true,
          incomeProofRequired: true,
          suitableForPeopleCount: 2,
          petsPolicy: "NOT_ALLOWED",
          smokingPolicy: "NOT_ALLOWED",
        },
      }),
    );

    const listing = await getPublicListingDetail("detail-2");

    expect(listing?.street).toBe("Calle 7");
    expect(listing?.zip).toBe("2001");
    expect(listing?.location).toBe("El Milagro · 2001 · Maracaibo");
    expect(listing?.objectType).toBe("HOUSE");
    expect(listing?.bedrooms).toBe(2);
    expect(listing?.shortDescription).toBe("Helles Haus");
    expect(listing?.minimumHouseholdNetIncome).toBe(3000);
    expect(listing?.schufaRequired).toBe(true);
    expect(listing?.incomeProofRequired).toBe(true);
    expect(listing?.suitableForPeopleCount).toBe(2);
    expect(listing?.petsPolicy).toBe("NOT_ALLOWED");
    expect(listing?.smokingPolicy).toBe("NOT_ALLOWED");
  });

  it("maps images from the detail payload and orders them by position", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({
        id: "detail-4",
        images: [
          {
            secureUrl: "https://res.cloudinary.com/b.jpg",
            position: 2,
            isCover: false,
          },
          {
            secureUrl: "https://res.cloudinary.com/a.jpg",
            position: 1,
            isCover: true,
          },
        ],
      }),
    );

    const listing = await getPublicListingDetail("detail-4");

    expect(listing?.images.map((image) => image.secureUrl)).toEqual([
      "https://res.cloudinary.com/a.jpg",
      "https://res.cloudinary.com/b.jpg",
    ]);
  });

  it("passes AbortSignal when options are provided", async () => {
    vi.mocked(apiGet).mockResolvedValue(detailResponse({ id: "x" }));
    const controller = new AbortController();

    await getPublicListingDetail("x", { signal: controller.signal });

    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings/x", {
      signal: controller.signal,
    });
  });
});
