import { MapPin } from "lucide-react";
import { DateTimeBadge } from "@/components/ui/date-time-badge/DateTimeBadge";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { StatusPill } from "../../listings-overview/components/StatusPill";
import { formatDateTime } from "../../listings-overview/utils/format";
import { OBJECT_TYPE_LABEL, listingDetailCopy } from "../copy/listing-detail";
import type { DetailAction, ListingDetail } from "../types";
import { DetailActionButton } from "./DetailActionButton";

interface DetailHeadProps {
  listing: ListingDetail;
  pendingAction: DetailAction | null;
  onAction: (action: DetailAction) => void;
}

const HEAD_CLASS =
  "mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6";
const KICKER_CLASS = "mb-2 flex flex-wrap items-center gap-2";
const TYPE_CHIP_CLASS =
  "rounded-sm border border-border px-1.75 py-0.75 font-mono text-meta tracking-normal text-foreground-tertiary uppercase";
const TITLE_CLASS =
  "mb-2 font-display text-title font-medium tracking-tight text-foreground text-balance";
const ADDR_CLASS =
  "flex items-center gap-1.5 text-body text-foreground-secondary";
const ACTIONS_CLASS = "flex flex-wrap items-center gap-2 max-sm:w-full";
const META_ROW_CLASS = "flex flex-wrap items-center gap-2";

const { actions } = listingDetailCopy;

interface ActionConfig {
  readonly action: DetailAction;
  readonly label: string;
  readonly loadingLabel: string;
}

function buildActions(listing: ListingDetail): ActionConfig[] {
  const list: ActionConfig[] = [];
  if (listing.status !== "published") {
    list.push({
      action: "publish",
      label: actions.publish,
      loadingLabel: actions.publishing,
    });
  }
  if (listing.status !== "draft") {
    list.push({
      action: "draft",
      label: actions.draft,
      loadingLabel: actions.drafting,
    });
  }
  if (listing.status !== "archived") {
    list.push({
      action: "archive",
      label: actions.archive,
      loadingLabel: actions.archiving,
    });
  }
  return list;
}

export function DetailHead({
  listing,
  pendingAction,
  onAction,
}: DetailHeadProps) {
  const actionConfigs = buildActions(listing);
  const anyPending = pendingAction !== null;
  const timestamp = listing.publishedAt ?? listing.updatedAt;
  const timestampLabel = timestamp ? formatDateTime(timestamp) : null;
  const timestampTitle = listing.publishedAt
    ? `Veröffentlicht am ${timestampLabel}`
    : `Aktualisiert am ${timestampLabel}`;

  return (
    <div className={HEAD_CLASS}>
      <div className="min-w-0">
        <div className={KICKER_CLASS}>
          <StatusPill status={listing.status} />
          {listing.objectType ? (
            <span className={TYPE_CHIP_CLASS}>
              {OBJECT_TYPE_LABEL[listing.objectType]}
            </span>
          ) : null}
        </div>
        {timestampLabel ? (
          <div className={META_ROW_CLASS}>
            <DateTimeBadge
              value={timestampLabel}
              title={timestampTitle}
              className="mb-2 h-7 px-2 text-meta"
            />
          </div>
        ) : null}
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

      {actionConfigs.length > 0 ? (
        <div className={ACTIONS_CLASS}>
          {actionConfigs.map((config) => (
            <DetailActionButton
              key={config.action}
              label={config.label}
              loadingLabel={config.loadingLabel}
              pending={pendingAction === config.action}
              disabled={anyPending}
              onClick={() => onAction(config.action)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
