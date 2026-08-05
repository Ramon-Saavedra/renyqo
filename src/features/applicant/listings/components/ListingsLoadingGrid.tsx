import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { listingsCopy } from "../copy/listings";

const LISTING_GRID_CLASS =
  "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

interface ListingsLoadingGridProps {
  count?: number;
}

const CARD_CLASS = "flex flex-col gap-2.5";

const MEDIA_CLASS = "aspect-square w-full rounded-md bg-background-muted";

const BODY_CLASS = "flex flex-col gap-1.5";

export function ListingsLoadingGrid({ count = 10 }: ListingsLoadingGridProps) {
  return (
    <div className={LISTING_GRID_CLASS} aria-busy="true">
      <span className="sr-only">{listingsCopy.loading}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={CARD_CLASS}>
          <div aria-hidden="true" className={MEDIA_CLASS} />
          <div className={BODY_CLASS}>
            <RenyqoSkeleton width="80%" height={12} />
            <RenyqoSkeleton width="50%" height={10} />
            <RenyqoSkeleton width="90%" height={10} />
            <RenyqoSkeleton width="55%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
