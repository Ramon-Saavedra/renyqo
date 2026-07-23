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
import { deleteListingImage, uploadListingImage } from "@/lib/api/listings";
import { listingDetailCopy } from "../../copy/listing-detail";

interface EditablePhoto {
  readonly id: string;
  readonly src: string;
}

interface EditableGalleryProps {
  listingId: string;
  images: readonly string[];
  onImagesChange?: (urls: readonly string[]) => void;
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
const THUMBS_VIEWPORT_CLASS = "w-full overflow-x-auto pb-1 scrollbar-slim";
const THUMBS_LIST_CLASS = "flex gap-1";
const MAIN_CLICK_CLASS = "cursor-pointer";
const THUMB_WRAP = "relative aspect-square basis-1/5 shrink-0";
const THUMB_BUTTON =
  "block h-full w-full cursor-pointer rounded-sm focus-visible:outline-none focus-visible:shadow-focus";
const THUMB_FRAME =
  "relative block h-full w-full overflow-hidden rounded-sm border-2 border-transparent bg-background-muted transition-colors";
const THUMB_ACTIVE = "border-primary";
const THUMB_DRAG_OVER = "border-primary border-dashed";

let photoIdCounter = 0;
function nextPhotoId(): string {
  photoIdCounter += 1;
  return `ep-${photoIdCounter}`;
}

export function EditableGallery({
  listingId,
  images,
  onImagesChange,
  className,
}: EditableGalleryProps) {
  const [photos, setPhotos] = useState<EditablePhoto[]>(() =>
    images.map((src) => ({ id: nextPhotoId(), src })),
  );
  const [active, setActive] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  }, []);

  const isInitialRef = useRef(true);
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    onImagesChange?.(photos.map((p) => p.src));
  }, [photos, onImagesChange]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
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
    async (photo: EditablePhoto) => {
      setDeletingIds((prev) => new Set(prev).add(photo.id));
      try {
        if (!photo.id.startsWith("ep-")) {
          await deleteListingImage(listingId, photo.id);
        }
      } catch {
        // keep local removal even if the API call fails
      }
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (active > 0) {
        setActive((prev) => Math.min(prev, photos.length - 2));
      }
      showFeedback("Bild entfernt");
    },
    [listingId, active, photos.length, showFeedback],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const file = files[0];
      if (!file) {
        setUploading(false);
        return;
      }
      try {
        const result = await uploadListingImage(listingId, file);
        const newPhoto: EditablePhoto = {
          id: result.id,
          src: URL.createObjectURL(file),
        };
        setPhotos((prev) => [...prev, newPhoto]);
        setActive((prev) => prev + 1);
        showFeedback("Foto hinzugefügt");
      } catch {
        // silently fail — the user can retry
      } finally {
        setUploading(false);
      }
    },
    [listingId, showFeedback],
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
      setPhotos((prev) => {
        if (dragIndex < 0 || dragIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        if (!moved) return prev;
        next.splice(index, 0, moved);
        return next;
      });
      setDragIndex(null);
      setActive(index);
      showFeedback("Reihenfolge geändert");
    },
    [dragIndex, showFeedback],
  );

  if (photos.length === 0) {
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

  const activeSrc = photos[Math.min(active, photos.length - 1)] ?? photos[0];

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
          {activeSrc ? (
            <Image
              src={activeSrc.src}
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
          {listingDetailCopy.gallery.counter(
            Math.min(active, photos.length - 1) + 1,
            photos.length,
          )}
        </span>
      </div>

      {feedback ? (
        <div className="rounded-sm bg-success/10 px-3 py-1.5 text-center text-caption font-medium text-success">
          {feedback}
        </div>
      ) : null}

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
                aria-pressed={index === active}
                className={THUMB_BUTTON}
                onClick={() => setActive(index)}
              >
                <span
                  className={cn(
                    THUMB_FRAME,
                    index === active && THUMB_ACTIVE,
                    dragOverIndex === index && THUMB_DRAG_OVER,
                  )}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 640px) 20vw, 200px"
                    loading={index === active ? "eager" : "lazy"}
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
                className="absolute top-0.5 right-0.5 grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-sm border-0 bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-30"
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
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            aria-label="Foto hinzufügen"
            className="flex aspect-square basis-1/5 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-dashed border-border-strong bg-background-muted text-foreground-tertiary transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
          >
            <AppIcon
              icon={uploading ? Loader : Upload}
              size={18}
              strokeWidth={1.6}
              className={uploading ? "animate-spin" : ""}
              decorative
            />
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
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
