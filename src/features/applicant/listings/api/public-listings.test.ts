import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import { getPublicListingDetail, getPublicListings } from "./public-listings";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

function listingSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-1",
    title: "Apartment in Berlin",
    city: "Berlin",
    zip: "10115",
    district: "Mitte",
    objectType: "APARTMENT",
    livingArea: 70,
    rooms: 3,
    bedrooms: 1,
    coldRent: 1200,
    additionalCosts: 200,
    deposit: 2400,
    depositMonths: 2,
    availableFrom: "2026-09-01T00:00:00.000Z",
    shortDescription: "Helle Wohnung",
    publishedAt: "2026-07-01T10:00:00.000Z",
    isNew: false,
    petsPolicy: null,
    coverImage: null,
    profileMatch: "UNKNOWN",
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
    ...overrides,
  };
}

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
        listingSummary({
          coverImage: {
            secureUrl: "https://res.cloudinary.com/example/apartment.jpg",
          },
          isNew: true,
        }),
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
    expect(listing?.applicationStatus).toBeNull();
    expect(listing?.publicReason).toBeNull();
    expect(listing?.isSaved).toBe(false);
    expect(listing?.coverImageUrl).toBe(
      "https://res.cloudinary.com/example/apartment.jpg",
    );
    expect(listing?.isNew).toBe(true);
    expect(listing?.publishedAt).toBe("2026-07-01T10:00:00.000Z");
  });

  it("maps coverImage.secureUrl and handles null coverImage", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        listingSummary({
          id: "a",
          coverImage: { secureUrl: "https://res.cloudinary.com/a.jpg" },
        }),
        listingSummary({
          id: "b",
          hasApplied: true,
          applicationStatus: "ACTIVE",
          coverImage: null,
        }),
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
        listingSummary({ id: "match", profileMatch: "MATCH" }),
        listingSummary({ id: "no-match", profileMatch: "NO_MATCH" }),
        listingSummary({
          id: "incomplete",
          profileMatch: "PROFILE_INCOMPLETE",
        }),
        listingSummary({ id: "unknown", profileMatch: "UNKNOWN" }),
      ],
      nextCursor: null,
      total: 4,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.matchesProfile).toBe(true);
    expect(listings[1]?.matchesProfile).toBe(false);
    expect(listings[2]?.matchesProfile).toBeNull();
    expect(listings[3]?.matchesProfile).toBeNull();
  });

  it("maps hasApplied from the listing summary contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        listingSummary({
          id: "applied",
          hasApplied: true,
          applicationStatus: "ACTIVE",
        }),
        listingSummary({ id: "open" }),
      ],
      nextCursor: null,
      total: 2,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.hasApplied).toBe(true);
    expect(listings[0]?.applicationStatus).toBe("ACTIVE");
    expect(listings[0]?.publicReason).toBeNull();
    expect(listings[1]?.hasApplied).toBe(false);
    expect(listings[1]?.applicationStatus).toBeNull();
    expect(listings[1]?.publicReason).toBeNull();
    expect(listings[0]?.isSaved).toBe(false);
    expect(listings[1]?.isSaved).toBe(false);
  });

  it("maps isSaved from the listing summary contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        listingSummary({ id: "saved", isSaved: true }),
        listingSummary({ id: "unsaved", isSaved: false }),
      ],
      nextCursor: null,
      total: 2,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.isSaved).toBe(true);
    expect(listings[1]?.isSaved).toBe(false);
  });

  it("maps applicationStatus and publicReason from the listing summary contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        listingSummary({
          id: "waiting",
          hasApplied: true,
          applicationStatus: "WAITING",
        }),
        listingSummary({
          id: "rejected",
          hasApplied: true,
          applicationStatus: "REJECTED",
          publicReason: "NOT_SELECTED",
        }),
        listingSummary({
          id: "accepted",
          hasApplied: true,
          applicationStatus: "ACCEPTED",
        }),
      ],
      nextCursor: null,
      total: 3,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.applicationStatus).toBe("WAITING");
    expect(listings[1]?.applicationStatus).toBe("REJECTED");
    expect(listings[1]?.publicReason).toBe("NOT_SELECTED");
    expect(listings[2]?.applicationStatus).toBe("ACCEPTED");
  });

  it("rejects a listing summary missing applicationStatus", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "missing-status", hasApplied: false, publicReason: null }],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects a listing summary missing publicReason", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { id: "missing-reason", hasApplied: false, applicationStatus: null },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects WITHDRAWN applicationStatus on listing summaries", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "withdrawn",
          hasApplied: false,
          applicationStatus: "WITHDRAWN",
          publicReason: null,
          isSaved: false,
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects an unknown publicReason on listing summaries", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "unknown-reason",
          hasApplied: true,
          applicationStatus: "REJECTED",
          publicReason: "UNKNOWN_REASON",
          isSaved: false,
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects a listing summary missing isSaved", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "missing-saved",
          hasApplied: false,
          applicationStatus: null,
          publicReason: null,
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it.each([
    ["additionalCosts"],
    ["city"],
    ["district"],
    ["availableFrom"],
    ["publishedAt"],
    ["isNew"],
    ["profileMatch"],
    ["coverImage"],
  ] as const)("rejects a listing summary missing %s", async (field) => {
    const payload: Record<string, unknown> = listingSummary();
    delete payload[field];
    vi.mocked(apiGet).mockResolvedValue({
      items: [payload],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it.each([
    ["additionalCosts", "200"],
    ["city", 12],
    ["availableFrom", 20260901],
    ["publishedAt", false],
    ["isNew", "true"],
    ["profileMatch", "LIKELY"],
    ["coverImage", { url: "https://res.cloudinary.com/x.jpg" }],
  ] as const)(
    "rejects a listing summary when %s has the wrong type",
    async (field, value) => {
      vi.mocked(apiGet).mockResolvedValue({
        items: [listingSummary({ [field]: value })],
        nextCursor: null,
        total: 1,
      });

      await expect(getPublicListings({})).rejects.toThrow(
        "Invalid public listings response",
      );
    },
  );

  it("rejects a listing summary with a mistyped title, rent, or living area", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "bad-types",
          title: 123,
          rooms: 3,
          livingArea: "70",
          coldRent: { amount: 1200 },
          hasApplied: false,
          applicationStatus: null,
          publicReason: null,
          isSaved: false,
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("rejects a listing summary with a non-boolean isSaved", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "bad-saved",
          hasApplied: false,
          applicationStatus: null,
          publicReason: null,
          isSaved: "yes",
        },
      ],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
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

  it("maps null summary fields to display fallbacks after a valid contract", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        listingSummary({
          id: "minimal",
          title: null,
          city: null,
          district: null,
          rooms: null,
          livingArea: null,
          coldRent: null,
          additionalCosts: null,
          availableFrom: null,
          publishedAt: null,
          coverImage: null,
          isNew: false,
        }),
      ],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    const listing = listings[0];
    expect(listing?.title).toBe("Unbenanntes Objekt");
    expect(listing?.location).toBe("Adresse folgt");
    expect(listing?.rooms).toBe(0);
    expect(listing?.coldRent).toBe(0);
    expect(listing?.serviceCharge).toBe(0);
    expect(listing?.coverImageUrl).toBeNull();
    expect(listing?.isNew).toBe(false);
    expect(listing?.publishedAt).toBe("");
    expect(listing?.availableFrom).toBeNull();
  });

  it("builds location from city and district", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [listingSummary({ id: "x", city: "Berlin", district: "Mitte" })],
      nextCursor: null,
      total: 1,
    });

    const { listings } = await getPublicListings({});
    expect(listings[0]?.location).toBe("Berlin, Mitte");
  });

  it("rejects a listing summary missing an id", async () => {
    const payload: Record<string, unknown> = listingSummary();
    delete payload.id;
    vi.mocked(apiGet).mockResolvedValue({
      items: [payload, listingSummary({ id: "valid" })],
      nextCursor: null,
      total: 1,
    });

    await expect(getPublicListings({})).rejects.toThrow(
      "Invalid public listings response",
    );
  });

  it("reads listings from data and listings wrappers", async () => {
    for (const wrapper of ["data", "listings"]) {
      vi.mocked(apiGet).mockResolvedValue({
        [wrapper]: [listingSummary({ id: wrapper })],
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
      hasApplied: false,
      applicationStatus: null,
      publicReason: null,
      isSaved: false,
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
    expect(listing?.hasApplied).toBe(false);
    expect(listing?.applicationStatus).toBeNull();
    expect(listing?.publicReason).toBeNull();
    expect(listing?.isSaved).toBe(false);
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

  it("maps hasApplied, applicationStatus, and publicReason from the detail contract", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({
        hasApplied: true,
        applicationStatus: "REJECTED",
        publicReason: "NOT_SELECTED",
      }),
    );

    const listing = await getPublicListingDetail("detail-1");
    expect(listing?.hasApplied).toBe(true);
    expect(listing?.applicationStatus).toBe("REJECTED");
    expect(listing?.publicReason).toBe("NOT_SELECTED");
    expect(listing?.isSaved).toBe(false);
  });

  it("maps isSaved from the detail contract", async () => {
    vi.mocked(apiGet).mockResolvedValue(detailResponse({ isSaved: true }));

    const listing = await getPublicListingDetail("detail-1");
    expect(listing?.isSaved).toBe(true);
  });

  it("rejects a detail response missing isSaved", async () => {
    const payload: Record<string, unknown> = { ...detailResponse() };
    delete payload.isSaved;
    vi.mocked(apiGet).mockResolvedValue(payload);

    await expect(getPublicListingDetail("x")).rejects.toThrow(
      "Invalid applicant listing detail response",
    );
  });

  it("rejects a detail response missing hasApplied", async () => {
    const payload: Record<string, unknown> = { ...detailResponse() };
    delete payload.hasApplied;
    vi.mocked(apiGet).mockResolvedValue(payload);

    await expect(getPublicListingDetail("x")).rejects.toThrow(
      "Invalid applicant listing detail response",
    );
  });

  it("rejects WITHDRAWN applicationStatus on listing detail", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({ applicationStatus: "WITHDRAWN" }),
    );

    await expect(getPublicListingDetail("x")).rejects.toThrow(
      "Invalid applicant listing detail response",
    );
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
    expect(
      Object.prototype.hasOwnProperty.call(
        listing ?? {},
        "minimumHouseholdNetIncome",
      ),
    ).toBe(false);
    expect(listing?.schufaRequired).toBe(true);
    expect(listing?.incomeProofRequired).toBe(true);
    expect(listing?.suitableForPeopleCount).toBe(2);
    expect(listing?.petsPolicy).toBe("NOT_ALLOWED");
    expect(listing?.smokingPolicy).toBe("NOT_ALLOWED");
  });

  it("maps a detail payload that omits minimumHouseholdNetIncome", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      detailResponse({
        requirements: {
          schufaRequired: true,
          incomeProofRequired: false,
          suitableForPeopleCount: null,
          petsPolicy: null,
          smokingPolicy: null,
        },
      }),
    );

    const listing = await getPublicListingDetail("detail-no-income");
    expect(listing?.schufaRequired).toBe(true);
    expect(listing?.incomeProofRequired).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(
        listing ?? {},
        "minimumHouseholdNetIncome",
      ),
    ).toBe(false);
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
