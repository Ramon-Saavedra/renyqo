import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePhotoGrid } from "./usePhotoGrid";
import type { ListingPhoto } from "./useListingDraft";

function makePhoto(id: string): ListingPhoto {
  return { id, src: `https://example.com/${id}.jpg` };
}

function makeFileList(files: File[]): FileList {
  return Object.assign(files, {
    item: (i: number) => files[i] ?? null,
  }) as unknown as FileList;
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

  describe("addFromFiles", () => {
    beforeEach(() => {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("adds a photo from a FileList when canAdd is true", () => {
      const photos: ListingPhoto[] = [];
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();
      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.addFromFiles(makeFileList([file]));
      });

      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(setPhotos).toHaveBeenCalledOnce();
      const added = setPhotos.mock.calls[0]![0] as ListingPhoto[];
      expect(added).toHaveLength(1);
      expect(added[0]!.src).toBe("blob:mock-url");
    });

    it("does nothing when photos count has reached the max", () => {
      const photos = Array.from({ length: 2 }, (_, i) => makePhoto(`p${i}`));
      const setPhotos = vi.fn();
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos, max: 2 }),
      );

      act(() => {
        result.current.addFromFiles(
          makeFileList([new File([""], "x.jpg", { type: "image/jpeg" })]),
        );
      });

      expect(setPhotos).not.toHaveBeenCalled();
    });

    it("only adds up to the remaining slots when multiple files exceed the max", () => {
      const existing = makePhoto("existing");
      const photos: ListingPhoto[] = [existing];
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();
      const { result } = renderHook(() =>
        usePhotoGrid({ photos, setPhotos, max: 2 }),
      );

      const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });
      const fileB = new File(["b"], "b.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.addFromFiles(makeFileList([fileA, fileB]));
      });

      const added = setPhotos.mock.calls[0]![0] as ListingPhoto[];
      expect(added).toHaveLength(2);
      expect(added[0]).toBe(existing);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it("appends to the existing photos array", () => {
      const existing = makePhoto("existing");
      const photos: ListingPhoto[] = [existing];
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();
      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.addFromFiles(
          makeFileList([new File(["c"], "c.jpg", { type: "image/jpeg" })]),
        );
      });

      const added = setPhotos.mock.calls[0]![0] as ListingPhoto[];
      expect(added).toHaveLength(2);
      expect(added[0]).toBe(existing);
    });
  });

  describe("remove", () => {
    it("removes the photo with the given id", () => {
      const a = makePhoto("a");
      const b = makePhoto("b");
      const photos: ListingPhoto[] = [a, b];
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.remove("a");
      });

      expect(setPhotos).toHaveBeenCalledOnce();
      const newPhotos = setPhotos.mock.calls[0]![0];
      expect(newPhotos).toHaveLength(1);
      expect(newPhotos).toContain(b);
    });

    it("returns an unchanged array when the id does not exist", () => {
      const a = makePhoto("a");
      const photos: ListingPhoto[] = [a];
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();

      const { result } = renderHook(() => usePhotoGrid({ photos, setPhotos }));

      act(() => {
        result.current.remove("ghost");
      });

      expect(setPhotos).toHaveBeenCalledOnce();
      const newPhotos = setPhotos.mock.calls[0]![0];
      expect(newPhotos).toHaveLength(1);
      expect(newPhotos).toContain(a);
    });

    it("results in an empty array when the only photo is removed", () => {
      const a = makePhoto("a");
      const setPhotos = vi.fn<(p: ReadonlyArray<ListingPhoto>) => void>();

      const { result } = renderHook(() =>
        usePhotoGrid({ photos: [a], setPhotos }),
      );

      act(() => {
        result.current.remove("a");
      });

      expect(setPhotos).toHaveBeenCalledOnce();
      const newPhotos = setPhotos.mock.calls[0]![0];
      expect(newPhotos).toHaveLength(0);
    });
  });
});
