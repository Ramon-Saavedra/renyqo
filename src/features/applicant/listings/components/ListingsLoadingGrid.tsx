import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { listingsCopy } from "../copy/listings";
import { LISTING_GRID_CLASS } from "./listing-grid-classes";

interface ListingsLoadingGridProps {
  count?: number;
}

const CARD_CLASS = "flex h-full flex-col gap-2.5 rounded-md";

const CARD_SHELL_CLASS = "relative h-full";

const MEDIA_CLASS =
  "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-media-placeholder";

const BADGE_SLOT_CLASS = "flex h-5 items-center";

const BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-1";

const TITLE_CLASS = "flex min-h-10 flex-col justify-center gap-1";

const STATS_CLASS = "flex flex-wrap items-center gap-x-1";

const PRICE_ROW_CLASS = "mt-auto flex flex-wrap items-baseline gap-x-1.5";

export function ListingsLoadingGrid({ count = 10 }: ListingsLoadingGridProps) {
  return (
    <div aria-busy="true">
      <span className="sr-only">{listingsCopy.loading}</span>
      <ul
        className={LISTING_GRID_CLASS}
        aria-label={listingsCopy.results.gridAriaLabel}
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div className={CARD_SHELL_CLASS}>
              <div className={CARD_CLASS}>
                <div className={MEDIA_CLASS}>
                  <RenyqoSkeleton className="absolute inset-0 h-full w-full rounded-md" />
                </div>
                <div className={BADGE_SLOT_CLASS}>
                  <RenyqoSkeleton variant="pill" width="42%" height={16} />
                </div>
                <div className={BODY_CLASS}>
                  <div className={TITLE_CLASS}>
                    <RenyqoSkeleton width="82%" height={13} />
                    <RenyqoSkeleton width="58%" height={13} />
                  </div>
                  <RenyqoSkeleton width="54%" height={11} />
                  <div className={STATS_CLASS}>
                    <RenyqoSkeleton width="23%" height={11} />
                    <RenyqoSkeleton width="33%" height={11} />
                    <RenyqoSkeleton
                      width="57%"
                      height={11}
                      className="basis-full"
                    />
                  </div>
                  <div className={PRICE_ROW_CLASS}>
                    <RenyqoSkeleton width="34%" height={14} />
                    <RenyqoSkeleton width="26%" height={11} />
                    <RenyqoSkeleton
                      width="53%"
                      height={11}
                      className="basis-full"
                    />
                  </div>
                </div>
              </div>
              <RenyqoSkeleton
                width={32}
                height={32}
                className="absolute top-2 right-2 rounded-sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
