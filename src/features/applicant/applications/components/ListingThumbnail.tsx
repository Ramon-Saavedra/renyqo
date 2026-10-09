import Image from "next/image";
import { House } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface ListingThumbnailProps {
  readonly imageUrl: string | null;
  readonly sizes: string;
  readonly fallbackLabel: string;
  readonly className?: string;
  readonly muted?: boolean;
}

export function ListingThumbnail({
  imageUrl,
  sizes,
  fallbackLabel,
  className,
  muted = false,
}: ListingThumbnailProps) {
  return (
    <span
      className={cn(
        "relative block aspect-4/3 shrink-0 self-start overflow-hidden rounded-sm bg-media-placeholder",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          className={cn("object-cover", muted && "opacity-85")}
        />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center text-caption text-foreground-tertiary">
          <AppIcon icon={House} size={18} strokeWidth={1.8} decorative />
          <span className="sr-only">{fallbackLabel}</span>
        </span>
      )}
    </span>
  );
}
