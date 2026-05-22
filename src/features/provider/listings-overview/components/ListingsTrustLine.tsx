import { Info } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

const WRAPPER_CLASS =
  "mb-6 flex items-center gap-2.5 rounded-md border border-border bg-background-subtle px-3.5 py-2.75 text-caption text-foreground-secondary";

const ICON_CLASS = "shrink-0 text-primary";

export function ListingsTrustLine() {
  return (
    <div className={WRAPPER_CLASS}>
      <span className={ICON_CLASS}>
        <AppIcon icon={Info} size={14} strokeWidth={1.6} decorative />
      </span>
      <span className="leading-snug">
        {listingsCopy.trust.lead}
        <strong className="font-medium text-foreground">
          {listingsCopy.trust.leadStrong}
        </strong>
        {listingsCopy.trust.leadTail}
      </span>
    </div>
  );
}
