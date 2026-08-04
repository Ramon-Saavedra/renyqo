import { MapPin, Share2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { formatEUR } from "@/features/provider/listings-overview/utils/format";
import { cn } from "@/lib/utils/cn";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import { MAX_ACTIVE_APPLICATIONS, type DashboardObject } from "../types";

interface ObjectSidebarItemProps {
  object: DashboardObject;
  selected: boolean;
  shareUrl: string;
  onSelect: (id: string) => void;
  fillAvailableSpace?: boolean;
}

const CARD_CLASS =
  "relative flex flex-col overflow-hidden rounded-md border bg-background shadow-card focus-within:shadow-focus";
const CARD_INACTIVE_CLASS = "border-border hover:border-primary-soft";
const CARD_ACTIVE_CLASS = "border-primary bg-primary";

const HEADER_CLASS = "flex shrink-0 items-center pl-3.5 pr-12 py-2";
const HEADER_INACTIVE_CLASS = "bg-primary-tint";
const HEADER_ACTIVE_CLASS =
  "border-b border-primary-foreground/15 bg-primary-foreground/12";

const STATUS_CLASS =
  "flex items-center gap-1.5 font-mono text-meta font-bold uppercase";
const STATUS_INACTIVE_CLASS = "text-primary";
const STATUS_ACTIVE_CLASS = "text-primary-foreground";
const DOT_CLASS = "h-1.5 w-1.5 rounded-full bg-current";

const SHARE_BUTTON_CLASS =
  "absolute top-2 right-3.5 z-10 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border focus-visible:outline-none focus-visible:shadow-focus";
const SHARE_INACTIVE_CLASS =
  "border-primary-soft bg-background text-primary hover:bg-primary-tint";
const SHARE_ACTIVE_CLASS =
  "border-primary-foreground/35 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25";

const BODY_CLASS = "flex flex-1 flex-col p-3.5";

const SELECT_CLASS =
  "absolute inset-0 z-0 w-full cursor-pointer rounded-md focus-visible:outline-none";

const TITLE_CLASS =
  "block min-w-0 truncate font-display text-brand font-semibold";
const TITLE_INACTIVE_CLASS = "text-foreground";
const TITLE_ACTIVE_CLASS = "text-primary-foreground";

const ADDRESS_CLASS = "mt-1.5 flex min-w-0 items-center gap-1.5 text-caption";
const ADDRESS_INACTIVE_CLASS = "text-foreground-tertiary";
const ADDRESS_ACTIVE_CLASS = "text-primary-foreground/70";

const RENT_ROW_CLASS = "mt-3 flex items-baseline justify-between gap-2";
const RENT_LABEL_CLASS = "font-mono text-meta uppercase";
const RENT_LABEL_INACTIVE_CLASS = "text-foreground-tertiary";
const RENT_LABEL_ACTIVE_CLASS = "text-primary-foreground/65";
const RENT_CLASS = "shrink-0 font-display text-body font-semibold";
const RENT_INACTIVE_CLASS = "text-foreground";
const RENT_ACTIVE_CLASS = "text-primary-foreground";

const BOTTOM_BLOCK_CLASS = "mt-auto block border-t pt-3";
const BOTTOM_BLOCK_INACTIVE_CLASS = "border-border";
const BOTTOM_BLOCK_ACTIVE_CLASS = "border-primary-foreground/20";

const PROGRESS_ROW_CLASS = "mb-1.5 flex items-baseline justify-between gap-2";
const PROGRESS_LABEL_CLASS = "text-caption";
const PROGRESS_LABEL_INACTIVE_CLASS = "text-foreground-secondary";
const PROGRESS_LABEL_ACTIVE_CLASS = "text-primary-foreground/80";
const PROGRESS_COUNT_CLASS =
  "shrink-0 font-mono text-caption font-bold whitespace-nowrap";
const PROGRESS_COUNT_INACTIVE_CLASS = "text-primary";
const PROGRESS_COUNT_ACTIVE_CLASS = "text-primary-foreground";
const TRACK_CLASS = "block h-1.5 overflow-hidden rounded-full";
const TRACK_INACTIVE_CLASS = "bg-primary-soft";
const TRACK_ACTIVE_CLASS = "bg-primary-foreground/30";
const FILL_CLASS = "block h-full rounded-full";
const FILL_INACTIVE_CLASS = "bg-primary";
const FILL_ACTIVE_CLASS = "bg-primary-foreground";

const DRAFT_NOTICE_CLASS = "block truncate text-caption";
const DRAFT_NOTICE_INACTIVE_CLASS = "text-foreground-secondary";
const DRAFT_NOTICE_ACTIVE_CLASS = "text-primary-foreground/80";

export function ObjectSidebarItem({
  object,
  selected,
  shareUrl,
  onSelect,
  fillAvailableSpace = true,
}: ObjectSidebarItemProps) {
  const { sidebar } = dashboardCopy;
  const isDraft = object.status === "draft";
  const activeApplications = object.activeApplications;
  const progressPercent = (activeApplications / MAX_ACTIVE_APPLICATIONS) * 100;

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (navigator.share) {
      void navigator
        .share({
          title: object.fullTitle,
          url: shareUrl,
        })
        .catch(() => undefined);
      return;
    }

    void navigator.clipboard?.writeText(shareUrl);
  };

  return (
    <li
      className={cn(
        CARD_CLASS,
        fillAvailableSpace ? "flex-1" : "shrink-0",
        selected ? CARD_ACTIVE_CLASS : CARD_INACTIVE_CLASS,
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${object.title}, ${object.address}`}
        className={SELECT_CLASS}
        onClick={() => onSelect(object.id)}
      />

      <span
        className={cn(
          HEADER_CLASS,
          selected ? HEADER_ACTIVE_CLASS : HEADER_INACTIVE_CLASS,
        )}
      >
        <span
          className={cn(
            STATUS_CLASS,
            selected ? STATUS_ACTIVE_CLASS : STATUS_INACTIVE_CLASS,
          )}
        >
          <span aria-hidden="true" className={DOT_CLASS} />
          {OBJECT_STATUS_LABEL[object.status]}
        </span>
      </span>

      <span className={BODY_CLASS}>
        <span
          className={cn(
            TITLE_CLASS,
            selected ? TITLE_ACTIVE_CLASS : TITLE_INACTIVE_CLASS,
          )}
        >
          {object.title}
        </span>
        <span
          className={cn(
            ADDRESS_CLASS,
            selected ? ADDRESS_ACTIVE_CLASS : ADDRESS_INACTIVE_CLASS,
          )}
        >
          <AppIcon icon={MapPin} size={12} strokeWidth={1.8} decorative />
          <span className="truncate">{object.address}</span>
        </span>

        <span className={RENT_ROW_CLASS}>
          <span
            className={cn(
              RENT_LABEL_CLASS,
              selected ? RENT_LABEL_ACTIVE_CLASS : RENT_LABEL_INACTIVE_CLASS,
            )}
          >
            {sidebar.rentLabel}
          </span>
          <span
            className={cn(
              RENT_CLASS,
              selected ? RENT_ACTIVE_CLASS : RENT_INACTIVE_CLASS,
            )}
          >
            {formatEUR(object.coldRent)}
          </span>
        </span>

        <span
          className={cn(
            BOTTOM_BLOCK_CLASS,
            selected ? BOTTOM_BLOCK_ACTIVE_CLASS : BOTTOM_BLOCK_INACTIVE_CLASS,
          )}
        >
          {isDraft ? (
            <span
              className={cn(
                DRAFT_NOTICE_CLASS,
                selected
                  ? DRAFT_NOTICE_ACTIVE_CLASS
                  : DRAFT_NOTICE_INACTIVE_CLASS,
              )}
            >
              {sidebar.draftNotice}
            </span>
          ) : (
            <>
              <span className={PROGRESS_ROW_CLASS}>
                <span
                  className={cn(
                    PROGRESS_LABEL_CLASS,
                    selected
                      ? PROGRESS_LABEL_ACTIVE_CLASS
                      : PROGRESS_LABEL_INACTIVE_CLASS,
                  )}
                >
                  {sidebar.applications}
                </span>
                <span
                  className={cn(
                    PROGRESS_COUNT_CLASS,
                    selected
                      ? PROGRESS_COUNT_ACTIVE_CLASS
                      : PROGRESS_COUNT_INACTIVE_CLASS,
                  )}
                >
                  {sidebar.applicationsCount(activeApplications)}
                </span>
              </span>
              <span
                role="progressbar"
                aria-label={sidebar.applicationsLabel(activeApplications)}
                aria-valuemin={0}
                aria-valuemax={MAX_ACTIVE_APPLICATIONS}
                aria-valuenow={activeApplications}
                className={cn(
                  TRACK_CLASS,
                  selected ? TRACK_ACTIVE_CLASS : TRACK_INACTIVE_CLASS,
                )}
              >
                <span
                  className={cn(
                    FILL_CLASS,
                    selected ? FILL_ACTIVE_CLASS : FILL_INACTIVE_CLASS,
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </span>
            </>
          )}
        </span>
      </span>

      {!isDraft && (
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            SHARE_BUTTON_CLASS,
            selected ? SHARE_ACTIVE_CLASS : SHARE_INACTIVE_CLASS,
          )}
          aria-label={sidebar.share.aria}
        >
          <AppIcon icon={Share2} size={14} strokeWidth={1.8} decorative />
        </button>
      )}
    </li>
  );
}
