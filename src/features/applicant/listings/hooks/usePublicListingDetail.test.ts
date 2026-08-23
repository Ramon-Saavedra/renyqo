import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { getPublicListingDetail } from "../api/public-listings";
import type { PublicListingDetail } from "../types";
import { usePublicListingDetail } from "./usePublicListingDetail";

vi.mock("../api/public-listings", () => ({
  getPublicListingDetail: vi.fn(),
}));

function mockListing(): PublicListingDetail {
  return {
    id: "d1",
    title: "Detail Listing",
    location: "Berlin",
    rooms: 2,
    livingArea: 50,
    availableFrom: null,
    coldRent: 900,
    additionalCosts: 100,
    matchesProfile: "unknown",
    isNew: false,
    publishedAt: "2026-01-01T00:00:00.000Z",
    street: null,
    zip: null,
    city: null,
    district: null,
    objectType: null,
    bedrooms: null,
    deposit: null,
    depositMonths: null,
    shortDescription: null,
    images: [],
    minimumHouseholdNetIncome: null,
    schufaRequired: false,
    incomeProofRequired: false,
    suitableForPeopleCount: null,
    petsPolicy: null,
    smokingPolicy: null,
  };
}

describe("usePublicListingDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transitions from loading to loaded", async () => {
    vi.mocked(getPublicListingDetail).mockResolvedValue(mockListing());

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });

    expect(result.current.listing?.id).toBe("d1");
    expect(result.current.listing?.title).toBe("Detail Listing");
  });

  it("transitions to not-found when the API returns null", async () => {
    vi.mocked(getPublicListingDetail).mockResolvedValue(null);

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    await waitFor(() => {
      expect(result.current.status).toBe("not-found");
    });

    expect(result.current.listing).toBeNull();
  });

  it("transitions to not-found on a 404 API error", async () => {
    vi.mocked(getPublicListingDetail).mockRejectedValue(
      new ApiError(404, "Not Found"),
    );

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    await waitFor(() => {
      expect(result.current.status).toBe("not-found");
    });
  });

  it("transitions to error with network message on status 0", async () => {
    vi.mocked(getPublicListingDetail).mockRejectedValue(
      new ApiError(0, "Netzwerkfehler"),
    );

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error).toBe(
      "Netzwerkfehler — bitte versuche es erneut",
    );
  });

  it("transitions to error with generic message on server error", async () => {
    vi.mocked(getPublicListingDetail).mockRejectedValue(
      new ApiError(500, "Internal Error"),
    );

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error).toBe("Objekt konnte nicht geladen werden");
  });

  it("transitions to a controlled error on a detail contract error", async () => {
    vi.mocked(getPublicListingDetail).mockRejectedValue(
      new Error("Invalid applicant listing detail response"),
    );

    const { result } = renderHook(() => usePublicListingDetail("d1"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error).toBe("Objekt konnte nicht geladen werden");
  });

  it("re-fetches when the id changes", async () => {
    vi.mocked(getPublicListingDetail).mockResolvedValue(mockListing());

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => usePublicListingDetail(id),
      { initialProps: { id: "first" } },
    );

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });

    vi.mocked(getPublicListingDetail).mockResolvedValue({
      ...mockListing(),
      id: "second",
      title: "Second Listing",
    });

    rerender({ id: "second" });

    await waitFor(() => {
      expect(result.current.listing?.id).toBe("second");
    });

    expect(getPublicListingDetail).toHaveBeenCalledTimes(2);
  });
});
