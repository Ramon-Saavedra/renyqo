import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INITIAL_DRAFT, useListingDraft } from "./useListingDraft";
import type { ListingDraft, ListingPhoto } from "./useListingDraft";

const PHOTO_FILE = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
const PHOTO: ListingPhoto = {
  id: "p1",
  src: "data:image/svg+xml;test",
  file: PHOTO_FILE,
};

describe("useListingDraft", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("initializes with INITIAL_DRAFT when no argument is given", () => {
      const { result } = renderHook(() => useListingDraft());

      expect(result.current.draft).toEqual(INITIAL_DRAFT);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
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

    it("updates a select string field", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("bedrooms", "2");
      });

      expect(result.current.draft.bedrooms).toBe("2");
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

  describe("history", () => {
    it("undoes and redoes a field change", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "Berlin");
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.city).toBe(INITIAL_DRAFT.city);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.draft.city).toBe("Berlin");
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("creates smaller checkpoints for rapid text changes", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "B");
        result.current.setField("city", "Be");
        result.current.setField("city", "Ber");
        result.current.setField("city", "Berl");
        result.current.setField("city", "Berli");
        result.current.setField("city", "Berlin");
      });

      expect(result.current.draft.city).toBe("Berlin");

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.city).toBe("Berl");
      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.city).toBe(INITIAL_DRAFT.city);
      expect(result.current.canUndo).toBe(false);
    });

    it("starts a new text history step after a short pause", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "B");
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        result.current.setField("city", "Be");
      });

      expect(result.current.draft.city).toBe("Be");

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.city).toBe("B");
    });

    it("creates a text history step at logical input boundaries", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "B");
        result.current.setField("city", "Be");
        result.current.setField("city", "Ber");
        result.current.setField("city", "Berl");
        result.current.setField("city", "Berli");
        result.current.setField("city", "Berlin");
        result.current.setField("city", "Berlin ");
      });

      expect(result.current.draft.city).toBe("Berlin ");

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.city).toBe("Berlin");
    });

    it("clears redo history after a new change", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setField("city", "Berlin");
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.setField("zip", "10115");
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.draft.zip).toBe("10115");
    });

    it("tracks photo changes in local history", () => {
      const { result } = renderHook(() => useListingDraft());

      act(() => {
        result.current.setPhotos([PHOTO]);
      });

      expect(result.current.draft.photos).toEqual([PHOTO]);

      act(() => {
        result.current.undo();
      });

      expect(result.current.draft.photos).toEqual(INITIAL_DRAFT.photos);
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
