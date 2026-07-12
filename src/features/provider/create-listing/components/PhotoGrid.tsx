"use client";

import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Upload, X } from "lucide-react";
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

function hasDraggedFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function PhotoGrid({ photos, setPhotos }: PhotoGridProps) {
  const copy = createListingCopy.objektdaten.fields.photos;
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const { canAdd, addFromFiles, remove } = usePhotoGrid({
    photos,
    setPhotos,
    max: copy.max,
  });

  const stopDragEvent = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) return;
      stopDragEvent(event);
      if (!canAdd) return;
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    },
    [canAdd, stopDragEvent],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) return;
      stopDragEvent(event);
      if (!canAdd) return;
      event.dataTransfer.dropEffect = "copy";
    },
    [canAdd, stopDragEvent],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) return;
      stopDragEvent(event);
      if (!canAdd) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDraggingFiles(false);
    },
    [canAdd, stopDragEvent],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) return;
      stopDragEvent(event);
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      if (canAdd && event.dataTransfer.files.length > 0) {
        addFromFiles(event.dataTransfer.files);
      }
    },
    [addFromFiles, canAdd, stopDragEvent],
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) addFromFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className="photo-grid"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
          <button
            type="button"
            aria-label={copy.addLabel}
            onClick={() => inputRef.current?.click()}
            className={cn("photo-drop", isDraggingFiles && "is-active")}
          >
            <span className="photo-drop-ring">
              <span className="photo-drop-icon">
                <AppIcon icon={Upload} size={18} strokeWidth={1.6} decorative />
              </span>
            </span>
            <span className="photo-drop-text">
              <strong className="photo-drop-title">
                {isDraggingFiles ? copy.dropActive : copy.dropTitle}
              </strong>
              <span className="photo-drop-action">
                <span className="photo-drop-link">{copy.dropAction}</span>
              </span>
            </span>
            <span className="photo-drop-hint">{copy.dropHint}</span>
          </button>
        )}
      </div>
      <p className="mb-0 text-caption leading-normal text-foreground-tertiary pt-2.5">
        {copy.hint}
      </p>
    </div>
  );
}
