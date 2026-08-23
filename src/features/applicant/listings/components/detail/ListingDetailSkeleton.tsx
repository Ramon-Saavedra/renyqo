import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { listingDetailCopy } from "../../copy/listing-detail";

const HEADER_ROW_CLASS =
  "flex flex-wrap items-start justify-between gap-4 gap-y-5";

const APPLY_BOX_CLASS =
  "flex w-full max-w-84 items-center gap-3 rounded-lg border border-border p-4 max-sm:max-w-none";

const MOSAIC_CLASS =
  "mt-6 mb-7 grid h-72 grid-cols-12 grid-rows-2 gap-2 sm:h-96 lg:h-128";

const FACTS_ROW_CLASS = "flex flex-wrap gap-4 border-y border-border py-4";

export function ListingDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label={listingDetailCopy.loadingAriaLabel}>
      <div className={HEADER_ROW_CLASS}>
        <div className="flex min-w-0 flex-col gap-2.5">
          <RenyqoSkeleton width={320} height={26} className="max-w-full" />
          <RenyqoSkeleton width={220} height={14} />
          <RenyqoSkeleton width={160} height={16} />
        </div>

        <div className={APPLY_BOX_CLASS}>
          <RenyqoSkeleton variant="pill" width={150} height={44} />
          <RenyqoSkeleton variant="pill" width={104} height={44} />
        </div>
      </div>

      <div className={MOSAIC_CLASS}>
        <RenyqoSkeleton className="col-span-6 row-span-2 h-full w-full sm:col-span-7 lg:col-span-5" />
        <RenyqoSkeleton className="col-span-6 row-span-2 h-full w-full sm:col-span-5 lg:col-span-4" />
        <RenyqoSkeleton className="hidden h-full w-full lg:block lg:col-span-3 lg:row-span-1" />
        <RenyqoSkeleton className="hidden h-full w-full lg:block lg:col-span-3 lg:row-span-1" />
      </div>

      <div className={FACTS_ROW_CLASS}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="flex grow basis-1/3 flex-col gap-2">
            <RenyqoSkeleton width={64} height={9} />
            <RenyqoSkeleton width={48} height={15} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex max-w-prose flex-col gap-2">
        <RenyqoSkeleton width={104} height={9} className="mb-1" />
        <RenyqoSkeleton height={12} />
        <RenyqoSkeleton height={12} />
        <RenyqoSkeleton width="60%" height={12} />
      </div>
    </div>
  );
}
