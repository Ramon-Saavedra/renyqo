"use client";

import { useCallback } from "react";
import type { ListingImageValidationError } from "../utils/listing-image-validation";
import { validateListingImageFile } from "../utils/listing-image-validation";
import type { ListingPhoto } from "./useListingDraft";

export type PhotoGridError = ListingImageValidationError;

interface UsePhotoGridArgs {
  readonly photos: ReadonlyArray<ListingPhoto>;
  readonly setPhotos: (photos: ReadonlyArray<ListingPhoto>) => void;
  readonly onError?: (error: PhotoGridError | null) => void;
  readonly max?: number;
}

interface UsePhotoGridResult {
  readonly canAdd: boolean;
  readonly addFromFiles: (files: FileList) => void;
  readonly remove: (id: string) => void;
}

export function usePhotoGrid({
  photos,
  setPhotos,
  onError,
  max = 12,
}: UsePhotoGridArgs): UsePhotoGridResult {
  const canAdd = photos.length < max;

  const addFromFiles = useCallback(
    (files: FileList) => {
      if (!canAdd) return;
      const remaining = max - photos.length;
      const selected = Array.from(files).slice(0, remaining);
      const invalid = selected
        .map((file) => validateListingImageFile(file))
        .find((error) => error !== null);
      if (invalid) {
        onError?.(invalid);
        return;
      }
      onError?.(null);
      const toAdd = selected;
      const newPhotos: ListingPhoto[] = toAdd.map((file) => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        src: URL.createObjectURL(file),
        file,
      }));
      setPhotos([...photos, ...newPhotos]);
    },
    [photos, setPhotos, onError, max, canAdd],
  );

  const remove = useCallback(
    (id: string) => {
      setPhotos(photos.filter((p) => p.id !== id));
    },
    [photos, setPhotos],
  );

  return { canAdd, addFromFiles, remove };
}
