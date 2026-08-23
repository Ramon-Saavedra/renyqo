import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import type { ListingImage } from "@/lib/api/listings";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../../copy/listing-detail";

interface ListingPhotoMosaicProps {
  images: readonly ListingImage[];
  title: string | null;
  className?: string;
}

const MAX_TILES = 4;

const COMPACT_TILES = 2;

const GRID_CLASS = "grid h-72 grid-cols-12 grid-rows-2 gap-2 sm:h-96 lg:h-128";

const TILE_CLASS =
  "relative overflow-hidden rounded-sm bg-background-muted min-w-0";

const IMAGE_CLASS = "object-cover";

const IMAGE_SIZES = "(min-width: 1024px) 40vw, (min-width: 640px) 45vw, 50vw";

const OVERLAY_CLASS =
  "absolute inset-0 items-center justify-center bg-foreground/55 font-display text-title font-semibold text-background";

const EMPTY_CLASS =
  "flex h-72 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-strong bg-background-subtle font-mono text-meta uppercase text-foreground-tertiary sm:h-96";

function tileClasses(count: number): readonly string[] {
  switch (count) {
    case 1:
      return ["col-span-12 row-span-2"];
    case 2:
      return [
        "col-span-6 row-span-2 sm:col-span-7",
        "col-span-6 row-span-2 sm:col-span-5",
      ];
    case 3:
      return [
        "col-span-6 row-span-2 sm:col-span-7 lg:col-span-5",
        "col-span-6 row-span-2 sm:col-span-5 lg:col-span-4",
        "hidden lg:block lg:col-span-3 lg:row-span-2",
      ];
    default:
      return [
        "col-span-6 row-span-2 sm:col-span-7 lg:col-span-5",
        "col-span-6 row-span-2 sm:col-span-5 lg:col-span-4",
        "hidden lg:block lg:col-span-3 lg:row-span-1",
        "hidden lg:block lg:col-span-3 lg:row-span-1",
      ];
  }
}

export function ListingPhotoMosaic({
  images,
  title,
  className,
}: ListingPhotoMosaicProps) {
  if (images.length === 0) {
    return (
      <div className={className}>
        <div className={EMPTY_CLASS}>
          <AppIcon icon={ImageIcon} size={22} strokeWidth={1.5} decorative />
          {listingDetailCopy.photos.empty}
        </div>
      </div>
    );
  }

  const tiles = images.slice(0, MAX_TILES);
  const spans = tileClasses(tiles.length);

  const compactHidden = images.length - COMPACT_TILES;
  const wideHidden = images.length - tiles.length;

  return (
    <div
      className={cn(GRID_CLASS, className)}
      aria-label={listingDetailCopy.photos.galleryLabel}
    >
      {tiles.map((image, index) => {
        const isLastCompactTile = index === COMPACT_TILES - 1;
        const isLastTile = index === tiles.length - 1;

        return (
          <div key={image.id} className={cn(TILE_CLASS, spans[index])}>
            <Image
              src={image.secureUrl}
              alt={listingDetailCopy.photos.imageAlt(title, index + 1)}
              fill
              sizes={IMAGE_SIZES}
              quality={90}
              loading={index === 0 ? "eager" : "lazy"}
              className={IMAGE_CLASS}
            />

            {isLastCompactTile && compactHidden > 0 && (
              <span
                className={cn(OVERLAY_CLASS, "flex lg:hidden")}
                aria-label={listingDetailCopy.photos.moreLabel(compactHidden)}
              >
                {listingDetailCopy.photos.more(compactHidden)}
              </span>
            )}

            {isLastTile && wideHidden > 0 && (
              <span
                className={cn(OVERLAY_CLASS, "hidden lg:flex")}
                aria-label={listingDetailCopy.photos.moreLabel(wideHidden)}
              >
                {listingDetailCopy.photos.more(wideHidden)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
