import { RotateCw, TriangleAlert } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../copy/listing-detail";

interface DetailErrorStateProps {
  onRetry: () => void;
}

const WRAP_CLASS =
  "flex flex-col items-center justify-center gap-4 rounded-lg border border-border px-6 py-20 text-center";
const ICON_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-md bg-background-muted text-danger";
const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";
const LEAD_CLASS = "max-w-sm text-body leading-normal text-foreground-tertiary";
const RETRY_CLASS =
  "mt-1 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong bg-transparent px-4.5 text-action font-medium text-foreground-secondary transition-colors hover:border-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function DetailErrorState({ onRetry }: DetailErrorStateProps) {
  return (
    <div className={WRAP_CLASS}>
      <span className={ICON_CLASS}>
        <AppIcon icon={TriangleAlert} size={22} strokeWidth={1.6} decorative />
      </span>
      <h2 className={TITLE_CLASS}>{listingDetailCopy.error.title}</h2>
      <p className={LEAD_CLASS}>{listingDetailCopy.error.lead}</p>
      <button type="button" className={RETRY_CLASS} onClick={onRetry}>
        <AppIcon icon={RotateCw} size={13} strokeWidth={1.6} decorative />
        {listingDetailCopy.error.retry}
      </button>
    </div>
  );
}
