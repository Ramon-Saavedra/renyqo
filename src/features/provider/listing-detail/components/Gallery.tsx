"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../copy/listing-detail";

interface GalleryProps {
  images: readonly string[];
  title: string;
  className?: string;
}

const EMPTY_CLASS =
  "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-strong px-6 text-center text-foreground-tertiary";

const MAIN_WRAP_CLASS = "relative";
const MAIN_CLASS =
  "relative aspect-[16/10] w-full overflow-hidden rounded-md bg-background-muted";
const COUNTER_CLASS =
  "absolute bottom-3 right-3 rounded-sm bg-foreground/55 px-2 py-1 font-mono text-meta tracking-normal text-background";
const THUMBS_CLASS = "mt-2.5 grid grid-cols-4 gap-2";
const THUMB_BASE =
  "relative aspect-square overflow-hidden rounded-sm border-2 border-transparent bg-background-muted transition-colors focus-visible:outline-none focus-visible:shadow-focus";
const THUMB_ACTIVE = "border-primary";

export function Gallery({ images, title, className }: GalleryProps) {
  const [active, setActive] = useState(0);

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
    <div className={className}>
      <div className={MAIN_WRAP_CLASS}>
        <div className={MAIN_CLASS}>
          {activeSrc ? (
            <Image
              src={activeSrc}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              loading="eager"
              quality={90}
              className="object-cover"
            />
          ) : null}
        </div>
        {images.length > 1 ? (
          <span className={COUNTER_CLASS}>
            {listingDetailCopy.gallery.counter(
              Math.min(active, images.length - 1) + 1,
              images.length,
            )}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className={THUMBS_CLASS}>
          {images.slice(0, 8).map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`${title} — Bild ${index + 1}`}
              aria-pressed={index === active}
              className={cn(THUMB_BASE, index === active && THUMB_ACTIVE)}
              onClick={() => setActive(index)}
            >
              <Image
                src={src}
                alt=""
                aria-hidden="true"
                fill
                sizes="120px"
                quality={75}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
