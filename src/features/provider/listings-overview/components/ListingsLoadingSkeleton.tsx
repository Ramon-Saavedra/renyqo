import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { listingsCopy } from "../copy/listings";

const ROW_COUNT = 4;

function RowSkeleton() {
  return (
    <div className="flex gap-4 px-5 py-4">
      <RenyqoSkeleton width={96} height={96} className="shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <RenyqoSkeleton height={13} width="55%" />
            <RenyqoSkeleton height={10} width="80%" />
          </div>
          <RenyqoSkeleton variant="pill" width={72} height={18} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RenyqoSkeleton height={28} />
          <RenyqoSkeleton height={28} />
          <RenyqoSkeleton height={28} />
          <RenyqoSkeleton height={28} />
        </div>
      </div>
    </div>
  );
}

/**
 * First-load state for the provider listings overview. A quiet cascade of
 * skeleton rows with the Renyqo light sweep, in place of a spinner.
 */
export function ListingsLoadingSkeleton() {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <RenyqoLoadingDots label={listingsCopy.loading} />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: ROW_COUNT }, (_, i) => (
          <RenyqoReveal
            key={i}
            loading
            stagger={i * 0.5}
            skeleton={<RowSkeleton />}
          />
        ))}
      </div>
    </div>
  );
}
