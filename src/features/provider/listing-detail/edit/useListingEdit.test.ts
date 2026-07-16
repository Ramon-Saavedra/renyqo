import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { updateListing } from "@/lib/api/listings";
import type { ListingDetail } from "../types";
import { listingEditCopy } from "./copy";
import { useListingEdit } from "./useListingEdit";
import { SAVED_HIGHLIGHT_MS } from "./useSavedHighlight";

vi.mock("@/lib/api/listings", () => ({
  updateListing: vi.fn(),
}));

const LISTING: ListingDetail = {
  id: "listing-1",
  title: "Helle Wohnung",
  status: "published",
  objectType: "APARTMENT",
  street: "Musterstraße 1",
  zip: "10115",
  city: "Berlin",
  showExactAddress: false,
  headerAddress: "Musterstraße 1, 10115 Berlin",
  coldRent: 1200,
  additionalCosts: 180,
  deposit: 2400,
  depositMonths: 2,
  livingArea: 70,
  rooms: 2.5,
  bedrooms: 1,
  availableFrom: "2026-08-01",
  shortDescription: "Ruhige Lage",
  schufaRequired: true,
  incomeProofRequired: false,
  minimumHouseholdNetIncome: 3000,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
  images: [],
  createdAt: null,
  updatedAt: null,
  publishedAt: null,
};

describe("useListingEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks the dirty state when a field changes", () => {
    const { result } = renderHook(() =>
      useListingEdit(LISTING, { onSaved: vi.fn() }),
    );

    expect(result.current.isDirty).toBe(false);
    act(() => result.current.setField("title", "Neuer Titel"));
    expect(result.current.isDirty).toBe(true);
  });

  it("saves without a request when nothing changed", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useListingEdit(LISTING, { onSaved }));

    await act(async () => {
      await result.current.save();
    });

    expect(updateListing).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("sends only changed fields and reports the saved listing", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(updateListing).mockResolvedValue(undefined);
      const onSaved = vi.fn();
      const { result } = renderHook(() => useListingEdit(LISTING, { onSaved }));

      act(() => result.current.setField("coldRent", "1350"));
      await act(async () => {
        await result.current.save();
      });

      expect(updateListing).toHaveBeenCalledWith("listing-1", {
        coldRent: 1350,
      });

      expect(onSaved).not.toHaveBeenCalled();
      expect(result.current.status).toBe("saved");

      await act(async () => {
        vi.advanceTimersByTime(SAVED_HIGHLIGHT_MS);
      });

      const saved = onSaved.mock.calls[0]?.[0] as ListingDetail;
      expect(saved.coldRent).toBe(1350);
    } finally {
      vi.useRealTimers();
    }
  });

  it("flashes only the changed fields and stops reading as dirty", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(updateListing).mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useListingEdit(LISTING, { onSaved: vi.fn() }),
      );

      act(() => result.current.setField("coldRent", "1350"));
      act(() => result.current.setField("city", "Hamburg"));
      await act(async () => {
        await result.current.save();
      });

      expect([...result.current.savedFields].sort()).toEqual([
        "city",
        "coldRent",
      ]);
      expect(result.current.isDirty).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(SAVED_HIGHLIGHT_MS);
      });

      expect(result.current.savedFields.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("blocks the save on validation errors", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useListingEdit(LISTING, { onSaved }));

    act(() => result.current.setField("title", "   "));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.errors.title).toBe(listingEditCopy.validation.title);
    expect(updateListing).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("surfaces a save error when the request fails", async () => {
    vi.mocked(updateListing).mockRejectedValue(new ApiError(500, "boom"));
    const onSaved = vi.fn();
    const { result } = renderHook(() => useListingEdit(LISTING, { onSaved }));

    act(() => result.current.setField("title", "Neuer Titel"));
    await act(async () => {
      await result.current.save();
    });

    await waitFor(() =>
      expect(result.current.error).toBe(listingEditCopy.error.save),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });
});
