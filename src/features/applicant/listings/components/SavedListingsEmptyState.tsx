import Link from "next/link";
import { Bookmark } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

const WRAPPER_CLASS =
  "flex flex-col items-center justify-center gap-5 rounded-md border border-dashed border-border-strong bg-background-muted px-6 py-14 text-center";

const MARK_CLASS =
  "inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary-tint text-primary";

const TITLE_CLASS = "font-display text-title font-medium text-foreground";

const LEAD_CLASS =
  "max-w-md text-caption leading-snug text-foreground-secondary";

export function SavedListingsEmptyState() {
  return (
    <div className={WRAPPER_CLASS}>
      <span aria-hidden="true" className={MARK_CLASS}>
        <AppIcon icon={Bookmark} size={24} strokeWidth={1.6} decorative />
      </span>
      <div className="flex flex-col items-center gap-2">
        <h2 className={TITLE_CLASS}>{listingsCopy.saved.emptyTitle}</h2>
        <p className={LEAD_CLASS}>{listingsCopy.saved.emptyLead}</p>
      </div>
      <Link href="/listings" className={buttonClass("primary")}>
        {listingsCopy.saved.browse}
      </Link>
    </div>
  );
}
