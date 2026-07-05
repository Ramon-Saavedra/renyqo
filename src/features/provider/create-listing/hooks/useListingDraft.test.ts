import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { INITIAL_DRAFT, useListingDraft } from "./useListingDraft";
import type { ListingDraft, ListingPhoto } from "./useListingDraft";

const PHOTO: ListingPhoto = { id: "p1", src: "data:image/svg+xml;test" };

describe("useListingDraft", () => {
  describe("initialization", () => {
    it("initializes with INITIAL_DRAFT when no argument is given", () => {
      const { result } = renderHook(() => useListingDraft());

      expect(result.current.draft).toEqual(INITIAL_DRAFT);
    });

    it("initializes with a custom initial draft when provided", () => {
      const custom: ListingDraft = { ...INITIAL_DRAFT, city: "Berlin" };
      const { result } = renderHook(() => useListingDraft(custom));

      expect(result.current.draft.city).toBe("Berlin");
    });
  });

  describe("setField", () => {
    it("updates a string field without touching other fields", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "Berlin");
      });

      expect(result.current.draft.city).toBe("Berlin");
      expect(result.current.draft.hideAddress).toBe(INITIAL_DRAFT.hideAddress);
      expect(result.current.draft.objectType).toBe(INITIAL_DRAFT.objectType);
    });

    it("updates a boolean field", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("hideAddress", false);
      });

      expect(result.current.draft.hideAddress).toBe(false);
    });

    it("updates a nullable number field", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("bedrooms", 2);
      });

      expect(result.current.draft.bedrooms).toBe(2);
    });

    it("updates legalAccepted independently", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("legalAccepted", true);
      });

      expect(result.current.draft.legalAccepted).toBe(true);
      expect(result.current.draft.city).toBe(INITIAL_DRAFT.city);
    });

    it("accumulates multiple setField calls correctly", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "Berlin");
        result.current.setField("price", "1200");
      });

      expect(result.current.draft.city).toBe("Berlin");
      expect(result.current.draft.price).toBe("1200");
    });
  });

  describe("setPhotos", () => {
    it("replaces the photos array", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setPhotos([PHOTO]);
      });

      expect(result.current.draft.photos).toEqual([PHOTO]);
    });

    it("sets photos to an empty array", () => {
      const initial: ListingDraft = { ...INITIAL_DRAFT, photos: [PHOTO] };
      const { result } = renderHook(() => useListingDraft(initial));

      act(() => {
        result.current.setPhotos([]);
      });

      expect(result.current.draft.photos).toHaveLength(0);
    });

    it("does not affect non-photo fields", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "Berlin");
        result.current.setPhotos([PHOTO]);
      });

      expect(result.current.draft.city).toBe("Berlin");
      expect(result.current.draft.photos).toEqual([PHOTO]);
    });
  });
});
