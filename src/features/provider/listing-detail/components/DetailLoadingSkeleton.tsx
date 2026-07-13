import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { listingDetailCopy } from "../copy/listing-detail";

const COLUMN_CONTAINER = "flex flex-col gap-5 lg:flex-row lg:items-start";
const LEFT_COLUMN = "flex flex-col gap-5 lg:w-3/5 lg:min-w-0";
const RIGHT_COLUMN = "flex flex-col gap-5 lg:w-2/5 lg:min-w-0";
const VEIL_CARD = "flex flex-col gap-3 p-5";

export function DetailLoadingSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <RenyqoLoadingDots label={listingDetailCopy.loading} />
      </div>

      <div className={COLUMN_CONTAINER}>
        <div className={LEFT_COLUMN}>
          <RenyqoReveal
            loading
            skeleton={
              <div className="p-3">
                <RenyqoSkeleton height={260} className="w-full rounded-md" />
              </div>
            }
          />
          <RenyqoReveal
            loading
            stagger={0.4}
            skeleton={
              <div className={VEIL_CARD}>
                <RenyqoSkeleton height={12} width="40%" />
                <RenyqoSkeleton height={9} width="95%" />
                <RenyqoSkeleton height={9} width="88%" />
                <RenyqoSkeleton height={9} width="60%" />
              </div>
            }
          />
          <RenyqoReveal
            loading
            stagger={0.8}
            skeleton={
              <div className={VEIL_CARD}>
                <RenyqoSkeleton height={12} width="55%" />
                <RenyqoSkeleton height={9} width="80%" />
                <RenyqoSkeleton height={9} width="70%" />
                <RenyqoSkeleton height={9} width="75%" />
              </div>
            }
          />
        </div>

        <div className={RIGHT_COLUMN}>
          <RenyqoReveal
            loading
            stagger={0.2}
            skeleton={
              <div className={VEIL_CARD}>
                <RenyqoSkeleton height={12} width="50%" />
                <RenyqoSkeleton height={34} />
                <RenyqoSkeleton height={34} />
                <RenyqoSkeleton height={34} />
              </div>
            }
          />
          <RenyqoReveal
            loading
            stagger={0.6}
            skeleton={
              <div className={VEIL_CARD}>
                <RenyqoSkeleton height={12} width="50%" />
                <RenyqoSkeleton height={9} width="60%" />
                <RenyqoSkeleton height={44} />
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
