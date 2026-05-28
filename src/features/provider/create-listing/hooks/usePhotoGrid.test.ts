import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePhotoGrid } from "./usePhotoGrid";
import type { ListingPhoto } from "./useListingDraft";

function makePhoto(id: string): ListingPhoto {
  return { id, src: `https://example.com/${id}.jpg` };
}

describe("usePhotoGrid", () => {
  describe("canAdd", () => {
    it("is true when photos count is below the default max of 12", () => {
      const photos = Array.from({ length: 11 }, (_, i) => makePhoto(`p${i}`));
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos: vi.fn() }),
      );

      expect(result.current.canAdd).toBe(true);
    });

    it("is false when photos count equals the default max of 12", () => {
      const photos = Array.from({ length: 12 }, (_, i) => makePhoto(`p${i}`));
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos: vi.fn() }),
      );

      expect(result.current.canAdd).toBe(false);
    });

    it("is false when photos count exceeds the default max of 12", () => {
      const photos = Array.from({ length: 13 }, (_, i) => makePhoto(`p${i}`));
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos: vi.fn() }),
      );

      expect(result.current.canAdd).toBe(false);
    });

    it("respects a custom max value", () => {
      const photos = [makePhoto("p0"), makePhoto("p1")];
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos: vi.fn(), max: 2 }),
      );

      expect(result.current.canAdd).toBe(false);
    });

    it("is true when photos count is below a custom max", () => {
      const photos = [makePhoto("p0")];
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos: vi.fn(), max: 3 }),
      );

      expect(result.current.canAdd).toBe(true);
    });
  });

  describe("addDemo", () => {
    beforeEach(() => {
      vi.spyOn(Date, "now").mockReturnValue(1000);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("adds a photo with a deterministic id when canAdd is true", () => {
      const photos: ListingPhoto[] = [];
      const setPhotos = vi.fn();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.addDemo();
      });

      expect(setPhotos).toHaveBeenCalledOnce();
      const newPhotos = setPhotos.mock.calls[0][0] as ListingPhoto[];
      expect(newPhotos).toHaveLength(1);
      expect(newPhotos[0].id).toBe("photo-1000-0");
      expect(newPhotos[0].src).toContain("data:image/svg+xml");
    });

    it("does nothing when photos count has reached the max", () => {
      const photos = Array.from({ length: 2 }, (_, i) => makePhoto(`p${i}`));
      const setPhotos = vi.fn();

      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos, max: 2 }),
      );

      act(() => {
        result.current.addDemo();
      });

      expect(setPhotos).not.toHaveBeenCalled();
    });

    it("appends to the existing photos array", () => {
      const existing = makePhoto("existing");
      const photos: ListingPhoto[] = [existing];
      const setPhotos = vi.fn();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.addDemo();
      });

      const newPhotos = setPhotos.mock.calls[0][0] as ListingPhoto[];
      expect(newPhotos).toHaveLength(2);
      expect(newPhotos[0]).toBe(existing);
    });
  });

  describe("remove", () => {
    it("removes the photo with the given id", () => {
      const a = makePhoto("a");
      const b = makePhoto("b");
      const photos: ListingPhoto[] = [a, b];
      const setPhotos = vi.fn();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.remove("a");
      });

      const newPhotos = setPhotos.mock.calls[0][0] as ListingPhoto[];
      expect(newPhotos).toHaveLength(1);
      expect(newPhotos[0]).toBe(b);
    });

    it("returns an unchanged array when the id does not exist", () => {
      const a = makePhoto("a");
      const photos: ListingPhoto[] = [a];
      const setPhotos = vi.fn();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.remove("ghost");
      });

      const newPhotos = setPhotos.mock.calls[0][0] as ListingPhoto[];
      expect(newPhotos).toHaveLength(1);
      expect(newPhotos[0]).toBe(a);
    });

    it("results in an empty array when the only photo is removed", () => {
      const a = makePhoto("a");
      const setPhotos = vi.fn();

      const { result } = renderHook(() =>
        usePhotoGrid({ photos: [a], setPhotos }),
      );

      act(() => {
        result.current.remove("a");
      });

      const newPhotos = setPhotos.mock.calls[0][0] as ListingPhoto[];
      expect(newPhotos).toHaveLength(0);
    });
  });
});
