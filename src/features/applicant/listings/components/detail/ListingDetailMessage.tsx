import Link from "next/link";
import { DoorOpen, TriangleAlert } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../../copy/listing-detail";

export type ListingDetailMessageTone = "not-found" | "error";

interface ListingDetailMessageProps {
  tone: ListingDetailMessageTone;
  title: string;
  lead: string;
}

const WRAPPER_CLASS =
  "flex flex-col items-center justify-center gap-5 rounded-md border border-dashed border-border-strong bg-background-muted px-6 py-14 text-center";

const MARK_CLASS =
  "inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary-tint text-primary";

const TITLE_CLASS = "font-display text-title font-medium text-foreground";

const LEAD_CLASS =
  "max-w-md text-caption leading-snug text-foreground-secondary";

const TONE_ICON = {
  "not-found": DoorOpen,
  error: TriangleAlert,
} as const;

export function ListingDetailMessage({
  tone,
  title,
  lead,
}: ListingDetailMessageProps) {
  return (
    <div
      className={WRAPPER_CLASS}
      role={tone === "error" ? "alert" : undefined}
    >
      <span aria-hidden="true" className={MARK_CLASS}>
        <AppIcon
          icon={TONE_ICON[tone]}
          size={24}
          strokeWidth={1.6}
          decorative
        />
      </span>

      <div className="flex flex-col items-center gap-2">
        <h1 className={TITLE_CLASS}>{title}</h1>
        <p className={LEAD_CLASS}>{lead}</p>
      </div>

      <Link
        href={listingDetailCopy.backHref}
        className={buttonClass("primary")}
      >
        {listingDetailCopy.backLinkShort}
      </Link>
    </div>
  );
}
