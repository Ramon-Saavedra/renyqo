"use client";

import { useCallback } from "react";
import type { ListingPhoto } from "./useListingDraft";

const DEMO_PALETTE = [
  "#D4D8DD",
  "#C8CCD1",
  "#BCC2CB",
  "#D8D2C5",
  "#C4CAB8",
  "#BFC6BF",
] as const;

function buildDemoSrc(index: number): string {
  const color = DEMO_PALETTE[index % DEMO_PALETTE.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'><rect width='200' height='150' fill='${color}'/><g opacity='.55' stroke='%23555452' stroke-width='1.2' fill='none'><path d='M30 110 L80 60 L120 100 L150 75 L180 110'/><circle cx='150' cy='40' r='10'/></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/'/g, "%27")}`;
}

interface UsePhotoGridArgs {
  readonly photos: ReadonlyArray<ListingPhoto>;
  readonly setPhotos: (photos: ReadonlyArray<ListingPhoto>) => void;
  readonly max?: number;
}

interface UsePhotoGridResult {
  readonly canAdd: boolean;
  readonly addDemo: () => void;
  readonly remove: (id: string) => void;
}

export function usePhotoGrid({
  photos,
  setPhotos,
  max = 12,
}: UsePhotoGridArgs): UsePhotoGridResult {
  const canAdd = photos.length < max;

  const addDemo = useCallback(() => {
    if (photos.length >= max) return;
    const next: ListingPhoto = {
      id: `photo-${Date.now()}-${photos.length}`,
      src: buildDemoSrc(photos.length),
    };
    setPhotos([...photos, next]);
  }, [photos, setPhotos, max]);

  const remove = useCallback(
    (id: string) => {
      setPhotos(photos.filter((p) => p.id !== id));
    },
    [photos, setPhotos],
  );

  return { canAdd, addDemo, remove };
}
