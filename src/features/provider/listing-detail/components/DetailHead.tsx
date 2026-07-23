import { Archive, FileText, Globe, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DateTimeBadge } from "@/components/ui/date-time-badge/DateTimeBadge";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { StatusPill } from "../../listings-overview/components/StatusPill";
import { formatDateTime } from "../../listings-overview/utils/format";
import { listingDetailCopy } from "../copy/listing-detail";
import type { DetailAction, ListingDetail } from "../types";
import { TypeChip } from "./TypeChip";

interface DetailHeadProps {
  listing: ListingDetail;
}

const TITLE_CLASS =
  "mb-2 font-display text-title font-medium tracking-tight text-foreground text-balance";
const ADDR_CLASS =
  "flex items-center gap-1.5 text-body text-foreground-secondary";

const { actions } = listingDetailCopy;

export interface ActionConfig {
  readonly action: DetailAction;
  readonly label: string;
  readonly shortLabel: string;
  readonly loadingLabel: string;
  readonly icon: LucideIcon;
}

export function buildActions(listing: ListingDetail): ActionConfig[] {
  const list: ActionConfig[] = [];
  if (listing.status !== "published") {
    list.push({
      action: "publish",
      label: actions.publish,
      shortLabel: actions.publishShort,
      loadingLabel: actions.publishing,
      icon: Globe,
    });
  }
  if (listing.status !== "draft") {
    list.push({
      action: "draft",
      label: actions.draft,
      shortLabel: actions.draftShort,
      loadingLabel: actions.drafting,
      icon: FileText,
    });
  }
  if (listing.status !== "archived") {
    list.push({
      action: "archive",
      label: actions.archive,
      shortLabel: actions.archiveShort,
      loadingLabel: actions.archiving,
      icon: Archive,
    });
  }
  return list;
}

export function DetailHead({ listing }: DetailHeadProps) {
  const timestamp = listing.publishedAt ?? listing.updatedAt;
  const timestampLabel = timestamp ? formatDateTime(timestamp) : null;
  const timestampTitle = listing.publishedAt
    ? `Veröffentlicht am ${timestampLabel}`
    : `Aktualisiert am ${timestampLabel}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className={TITLE_CLASS}>{listing.title}</h1>
        <span className={ADDR_CLASS}>
          <AppIcon
            icon={MapPin}
            size={13}
            strokeWidth={1.6}
            decorative
            className="text-foreground-tertiary"
          />
          {listing.headerAddress}
        </span>
      </div>

      {listing.objectType ? (
        <div className="mt-1 self-start">
          <TypeChip objectType={listing.objectType} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {timestampLabel ? (
          <DateTimeBadge
            value={timestampLabel}
            title={timestampTitle}
            className="h-7 px-2 text-meta"
          />
        ) : null}
        <StatusPill status={listing.status} />
      </div>
    </div>
  );
}
