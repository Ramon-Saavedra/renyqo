"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { ListingImage } from "@/lib/api/listings";
import { listingDetailCopy } from "../copy/listing-detail";

interface GalleryProps {
  images: readonly ListingImage[];
  title: string;
  className?: string;
}

const EMPTY_CLASS =
  "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-strong px-6 text-center text-foreground-tertiary";

const ROOT_CLASS = "flex flex-col gap-2.5";
const MAIN_WRAP_CLASS = "relative group";
const MAIN_CLASS =
  "relative aspect-[16/10] w-full overflow-hidden rounded-md bg-background-muted";
const ARROW_BASE =
  "absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-foreground/20 text-background transition-colors hover:bg-foreground/55 focus-visible:outline-none focus-visible:shadow-focus";
const COUNTER_CLASS =
  "absolute bottom-3 right-3 rounded-sm bg-foreground/55 px-2 py-1 font-mono text-meta tracking-normal text-background";
const THUMBS_VIEWPORT_CLASS = "w-full overflow-x-auto pb-1 scrollbar-slim";
const THUMBS_LIST_CLASS = "flex";
const THUMB_BUTTON =
  "aspect-square basis-1/5 shrink-0 rounded-sm focus-visible:outline-none focus-visible:shadow-focus";
const THUMB_FRAME =
  "relative block h-full w-full overflow-hidden rounded-sm border-2 border-transparent bg-background-muted transition-colors";
const THUMB_ACTIVE = "border-primary";
const MAIN_CLICK_CLASS = "cursor-pointer";

export function Gallery({ images, title, className }: GalleryProps) {
  const [active, setActive] = useState(0);

  const handlePrev = useCallback(() => {
    setActive((a) => (a > 0 ? a - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setActive((a) => (a < images.length - 1 ? a + 1 : 0));
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className={className}>
        <div className={EMPTY_CLASS}>
          <AppIcon icon={ImageIcon} size={26} strokeWidth={1.4} decorative />
          <p className="max-w-xs text-caption leading-relaxed">
            {listingDetailCopy.gallery.emptyLead}
          </p>
        </div>
      </div>
    );
  }

  const activeSrc = images[Math.min(active, images.length - 1)] ?? images[0];

  return (
    <div className={cn(ROOT_CLASS, className)}>
      <div className={MAIN_WRAP_CLASS}>
        <div
          className={cn(MAIN_CLASS, images.length > 1 && MAIN_CLICK_CLASS)}
          onClick={images.length > 1 ? handleNext : undefined}
          role={images.length > 1 ? "button" : undefined}
          tabIndex={images.length > 1 ? 0 : undefined}
          aria-label={images.length > 1 ? "Nächstes Bild" : undefined}
          onKeyDown={
            images.length > 1
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") handleNext();
                }
              : undefined
          }
        >
          {activeSrc ? (
            <Image
              src={activeSrc.secureUrl}
              alt={title}
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

        {images.length > 1 ? (
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
            <span className={COUNTER_CLASS}>
              {listingDetailCopy.gallery.counter(
                Math.min(active, images.length - 1) + 1,
                images.length,
              )}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className={THUMBS_VIEWPORT_CLASS}>
          <div className={THUMBS_LIST_CLASS}>
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                aria-label={`${title} — Bild ${index + 1}`}
                aria-pressed={index === active}
                className={THUMB_BUTTON}
                onClick={() => setActive(index)}
              >
                <span
                  className={cn(THUMB_FRAME, index === active && THUMB_ACTIVE)}
                >
                  <Image
                    src={img.secureUrl}
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
