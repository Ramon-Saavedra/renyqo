import { buttonClassWithSize } from "@/components/ui/button/Button";
import { listingsCopy } from "../copy/listings";

interface ListingsErrorBannerProps {
  onRetry: () => void;
}

const WRAPPER_CLASS =
  "mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-warning/10 px-4.5 py-3.5";

const TEXT_CLASS = "text-caption text-warning";

export function ListingsErrorBanner({ onRetry }: ListingsErrorBannerProps) {
  return (
    <div role="alert" className={WRAPPER_CLASS}>
      <span className={TEXT_CLASS}>{listingsCopy.error.message}</span>
      <button
        type="button"
        className={buttonClassWithSize("outline", "sm", "shrink-0")}
        onClick={onRetry}
      >
        {listingsCopy.error.retry}
      </button>
    </div>
  );
}
