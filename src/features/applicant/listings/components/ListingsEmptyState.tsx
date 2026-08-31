import { DoorOpen } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

interface ListingsEmptyStateProps {
  onReset: () => void;
}

const WRAPPER_CLASS =
  "flex flex-col items-center justify-center gap-5 rounded-md border border-dashed border-border-strong bg-background-muted px-6 py-14 text-center";

const MARK_CLASS =
  "inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary-tint text-primary";

const TITLE_CLASS = "font-display text-title font-medium text-foreground";

const LEAD_CLASS =
  "max-w-md text-caption leading-snug text-foreground-secondary";

export function ListingsEmptyState({ onReset }: ListingsEmptyStateProps) {
  return (
    <div className={WRAPPER_CLASS}>
      <span aria-hidden="true" className={MARK_CLASS}>
        <AppIcon icon={DoorOpen} size={24} strokeWidth={1.6} decorative />
      </span>
      <div className="flex flex-col items-center gap-2">
        <h2 className={TITLE_CLASS}>{listingsCopy.empty.title}</h2>
        <p className={LEAD_CLASS}>{listingsCopy.empty.lead}</p>
      </div>
      <button
        type="button"
        className={buttonClass("primary")}
        onClick={onReset}
      >
        {listingsCopy.empty.reset}
      </button>
    </div>
  );
}
