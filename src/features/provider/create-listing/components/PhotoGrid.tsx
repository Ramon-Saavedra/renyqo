"use client";

import { Camera, X } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { createListingCopy } from "../copy/create-listing";
import type { ListingPhoto } from "../hooks/useListingDraft";
import { usePhotoGrid } from "../hooks/usePhotoGrid";

interface PhotoGridProps {
  photos: ReadonlyArray<ListingPhoto>;
  setPhotos: (photos: ReadonlyArray<ListingPhoto>) => void;
}

const TILE_BASE =
  "group relative aspect-[4/3] overflow-hidden rounded-md border bg-background-subtle";
const TILE_IDLE = "border-border";
const TILE_COVER = "border-border shadow-cover-ring";

const COVER_TAG_CLASS =
  "absolute top-1.5 left-1.5 rounded-sm border border-primary-soft bg-background px-1.5 py-0.75 font-mono text-meta uppercase text-primary";

const REMOVE_BTN_CLASS =
  "absolute top-1.5 right-1.5 grid h-5.5 w-5.5 cursor-pointer place-items-center rounded-md border-0 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100";

const ADD_BTN_CLASS =
  "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-background-subtle font-mono text-meta uppercase text-foreground-tertiary transition-colors hover:border-primary hover:bg-primary-tint hover:text-primary";

export function PhotoGrid({ photos, setPhotos }: PhotoGridProps) {
  const copy = createListingCopy.objektdaten.fields.photos;
  const { canAdd, addDemo, remove } = usePhotoGrid({
    photos,
    setPhotos,
    max: copy.max,
  });

  return (
    <div>
      <div className="photo-grid">
        {photos.map((photo, index) => {
          const isCover = index === 0;
          const tileClass = cn(TILE_BASE, isCover ? TILE_COVER : TILE_IDLE);
          return (
            <div key={photo.id} className={tileClass}>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${photo.src})` }}
              />
              {isCover && <span className={COVER_TAG_CLASS}>{copy.cover}</span>}
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={copy.remove}
                className={REMOVE_BTN_CLASS}
              >
                <AppIcon icon={X} size={11} strokeWidth={1.5} decorative />
              </button>
            </div>
          );
        })}
        {canAdd && (
          <button type="button" onClick={addDemo} className={ADD_BTN_CLASS}>
            <AppIcon icon={Camera} size={20} strokeWidth={1.2} decorative />
            <span>{copy.addLabel}</span>
          </button>
        )}
      </div>
      <p className="mb-0 text-caption leading-normal text-foreground-tertiary pt-2.5">
        {copy.hint}
      </p>
    </div>
  );
}
