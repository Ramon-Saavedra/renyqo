"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader,
  Upload,
  X,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import {
  deleteListingImage,
  reorderListingImages,
  uploadListingImage,
} from "@/lib/api/listings";
import type { ListingImage } from "@/lib/api/listings";
import { listingDetailCopy } from "../../copy/listing-detail";

interface EditableGalleryProps {
  listingId: string;
  images: readonly ListingImage[];
  onImagesChange?: (images: readonly ListingImage[]) => void;
  className?: string;
}

const COUNTER_CLASS =
  "absolute bottom-3 right-3 rounded-sm bg-foreground/55 px-2 py-1 font-mono text-meta tracking-normal text-background";

const ARROW_BASE =
  "absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-foreground/20 text-background transition-colors hover:bg-foreground/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus";

const EMPTY_CLASS =
  "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-strong px-6 text-center text-foreground-tertiary";

const ROOT_CLASS = "flex flex-col gap-2.5";
const MAIN_WRAP_CLASS = "relative group";
const MAIN_CLASS =
  "relative aspect-[16/10] w-full overflow-hidden rounded-md bg-background-muted";
const THUMBS_VIEWPORT_CLASS = "w-full";
const THUMBS_LIST_CLASS = "grid grid-cols-5 gap-1";
const MAIN_CLICK_CLASS = "cursor-pointer";
const THUMB_WRAP = "relative aspect-square";
const THUMB_BUTTON =
  "block h-full w-full cursor-pointer rounded-sm focus-visible:outline-none focus-visible:shadow-focus";
const THUMB_FRAME =
  "relative block h-full w-full overflow-hidden rounded-sm border-2 border-transparent bg-background-muted transition-colors";
const THUMB_ACTIVE = "border-primary";
const THUMB_DRAG_OVER = "border-primary border-dashed";
const MAX_PHOTOS = 12;

export function EditableGallery({
  listingId,
  images,
  onImagesChange,
  className,
}: EditableGalleryProps) {
  const [photos, setPhotos] = useState<ListingImage[]>(() => [...images]);
  const [active, setActive] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const photosRef = useRef<ListingImage[]>(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  }, []);

  const revokePreviewUrl = useCallback((tempId: string) => {
    const url = previewUrlsRef.current.get(tempId);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(tempId);
    }
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    },
    [],
  );

  const handlePrev = useCallback(() => {
    setActive((a) => (a > 0 ? a - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setActive((a) => (a < photos.length - 1 ? a + 1 : 0));
  }, [photos.length]);

  const handleRemove = useCallback(
    async (photo: ListingImage) => {
      setDeletingIds((prev) => new Set(prev).add(photo.id));
      try {
        await deleteListingImage(listingId, photo.id);
      } catch {}
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
      const next = photosRef.current.filter((p) => p.id !== photo.id);
      setPhotos(next);
      onImagesChange?.(next);
      if (active >= next.length && active > 0) {
        setActive(next.length - 1);
      }
      showFeedback("Bild entfernt");
    },
    [listingId, active, showFeedback, onImagesChange],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      const selected = Array.from(files);
      if (selected.length === 0) return;

      const remaining = MAX_PHOTOS - photosRef.current.length;
      if (remaining <= 0) {
        showFeedback(`Maximal ${MAX_PHOTOS} Fotos erlaubt`);
        return;
      }

      const toUpload = selected.slice(0, remaining);
      setUploading(true);

      const provisionals = toUpload.map((f) => {
        const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const url = URL.createObjectURL(f);
        previewUrlsRef.current.set(id, url);
        return { id, url, file: f };
      });

      const provisionalImages: ListingImage[] = provisionals.map((p) => ({
        id: p.id,
        secureUrl: p.url,
        position: photosRef.current.length,
        isCover: false,
      }));

      const updated = [...photosRef.current, ...provisionalImages];
      setPhotos(updated);
      setActive(updated.length - 1);

      let successCount = 0;

      for (const p of provisionals) {
        try {
          const result = await uploadListingImage(listingId, p.file);
          const idx = updated.findIndex((img) => img.id === p.id);
          if (idx !== -1) {
            updated[idx] = result;
            setPhotos([...updated]);
          }
          successCount += 1;
        } catch {
          const idx = updated.findIndex((img) => img.id === p.id);
          if (idx !== -1) {
            updated.splice(idx, 1);
            setPhotos([...updated]);
          }
        } finally {
          revokePreviewUrl(p.id);
        }
      }

      onImagesChange?.(updated);
      setUploading(false);

      if (successCount > 0) {
        showFeedback(
          `${successCount} Foto${successCount !== 1 ? "s" : ""} hinzugefügt`,
        );
      }
      if (toUpload.length < selected.length) {
        showFeedback(
          `${toUpload.length} Foto${toUpload.length !== 1 ? "s" : ""} hochgeladen, ${selected.length - toUpload.length} übersprungen (max. ${MAX_PHOTOS})`,
        );
      }
    },
    [listingId, showFeedback, onImagesChange, revokePreviewUrl],
  );

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [],
  );

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
      if (dragIndex === null || dragIndex === index) return;
      const prev = photosRef.current;
      if (dragIndex < 0 || dragIndex >= prev.length) {
        setDragIndex(null);
        return;
      }
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      if (!moved) {
        setDragIndex(null);
        return;
      }
      next.splice(index, 0, moved);
      setPhotos(next);
      onImagesChange?.(next);
      reorderListingImages(
        listingId,
        next.map((p) => p.id),
      ).catch(() => {});
      setDragIndex(null);
      setActive(index);
      showFeedback("Reihenfolge geändert");
    },
    [dragIndex, listingId, showFeedback, onImagesChange],
  );

  const hasImages = photos.length > 0;

  if (!hasImages) {
    return (
      <div className={cn(className)}>
        <div className={EMPTY_CLASS}>
          <AppIcon icon={ImageIcon} size={26} strokeWidth={1.4} decorative />
          <p className="max-w-xs text-caption leading-relaxed">
            {listingDetailCopy.gallery.emptyLead}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-action font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <AppIcon
              icon={uploading ? Loader : Upload}
              size={14}
              strokeWidth={1.6}
              className={uploading ? "animate-spin" : ""}
              decorative
            />
            {uploading ? "Wird hochgeladen …" : "Foto hinzufügen"}
          </button>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(active, photos.length - 1);
  const activePhoto = photos[safeIndex] ?? photos[0];

  return (
    <div className={cn(ROOT_CLASS, className)}>
      <div className={MAIN_WRAP_CLASS}>
        <div
          className={cn(MAIN_CLASS, photos.length > 1 && MAIN_CLICK_CLASS)}
          onClick={photos.length > 1 ? handleNext : undefined}
          role={photos.length > 1 ? "button" : undefined}
          tabIndex={photos.length > 1 ? 0 : undefined}
          aria-label={photos.length > 1 ? "Nächstes Bild" : undefined}
          onKeyDown={
            photos.length > 1
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") handleNext();
                }
              : undefined
          }
        >
          {activePhoto ? (
            <Image
              src={activePhoto.secureUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              loading="eager"
              preload
              fetchPriority="high"
              quality={90}
              className="object-cover"
            />
          ) : null}
        </div>

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Vorheriges Bild"
              onClick={handlePrev}
              className={cn(ARROW_BASE, "left-2")}
            >
              <AppIcon
                icon={ChevronLeft}
                size={20}
                strokeWidth={1.8}
                decorative
              />
            </button>
            <button
              type="button"
              aria-label="Nächstes Bild"
              onClick={handleNext}
              className={cn(ARROW_BASE, "right-2")}
            >
              <AppIcon
                icon={ChevronRight}
                size={20}
                strokeWidth={1.8}
                decorative
              />
            </button>
          </>
        ) : null}

        <span className={COUNTER_CLASS}>
          {listingDetailCopy.gallery.counter(safeIndex + 1, photos.length)}
        </span>
      </div>

      {feedback ? (
        <div className="rounded-sm bg-success/10 px-3 py-1.5 text-center text-caption font-medium text-success">
          {feedback}
        </div>
      ) : null}

      <p className="text-caption text-foreground-tertiary">
        Fotos per Drag &amp; Drop sortieren. Das erste Foto ist das Titelbild.
      </p>

      <div className={THUMBS_VIEWPORT_CLASS}>
        <div className={THUMBS_LIST_CLASS}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={THUMB_WRAP}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
            >
              <button
                type="button"
                aria-label={`Bild ${index + 1}`}
                aria-pressed={index === safeIndex}
                className={THUMB_BUTTON}
                onClick={() => setActive(index)}
              >
                <span
                  className={cn(
                    THUMB_FRAME,
                    index === safeIndex && THUMB_ACTIVE,
                    dragOverIndex === index && THUMB_DRAG_OVER,
                  )}
                >
                  <Image
                    src={photo.secureUrl}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 640px) 20vw, 200px"
                    loading={index === safeIndex ? "eager" : "lazy"}
                    quality={90}
                    className="object-cover"
                  />
                </span>
              </button>
              <button
                type="button"
                aria-label={`Bild ${index + 1} entfernen`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(photo);
                }}
                disabled={uploading || deletingIds.has(photo.id)}
                className="absolute top-0.5 right-0.5 grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-sm border-0 bg-black/55 text-white focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-30"
              >
                <AppIcon
                  icon={deletingIds.has(photo.id) ? Loader : X}
                  size={10}
                  strokeWidth={1.8}
                  className={deletingIds.has(photo.id) ? "animate-spin" : ""}
                  decorative
                />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              aria-label="Foto hinzufügen"
              className="flex aspect-square cursor-pointer items-center justify-center rounded-sm border border-dashed border-border-strong bg-background-muted text-foreground-tertiary transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
            >
              <AppIcon
                icon={uploading ? Loader : Upload}
                size={18}
                strokeWidth={1.6}
                className={uploading ? "animate-spin" : ""}
                decorative
              />
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
