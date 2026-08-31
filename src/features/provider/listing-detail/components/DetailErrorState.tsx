import { RotateCw, TriangleAlert } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../copy/listing-detail";

interface DetailErrorStateProps {
  onRetry: () => void;
}

const WRAP_CLASS =
  "flex flex-col items-center justify-center gap-4 rounded-md border border-border px-6 py-20 text-center";
const ICON_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-md bg-background-muted text-danger";
const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";
const LEAD_CLASS = "max-w-sm text-body leading-normal text-foreground-tertiary";

export function DetailErrorState({ onRetry }: DetailErrorStateProps) {
  return (
    <div className={WRAP_CLASS}>
      <span className={ICON_CLASS}>
        <AppIcon icon={TriangleAlert} size={22} strokeWidth={1.6} decorative />
      </span>
      <h2 className={TITLE_CLASS}>{listingDetailCopy.error.title}</h2>
      <p className={LEAD_CLASS}>{listingDetailCopy.error.lead}</p>
      <button
        type="button"
        className={buttonClass("outline", "justify-center mt-1")}
        onClick={onRetry}
      >
        <AppIcon icon={RotateCw} size={13} strokeWidth={1.6} decorative />
        {listingDetailCopy.error.retry}
      </button>
    </div>
  );
}
