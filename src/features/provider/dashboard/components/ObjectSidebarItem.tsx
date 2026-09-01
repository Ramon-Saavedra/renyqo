import Image from "next/image";
import { Home, MapPin, Share2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { formatEUR } from "@/features/provider/listings-overview/utils/format";
import { cn } from "@/lib/utils/cn";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";

interface ObjectSidebarItemProps {
  object: DashboardObject;
  selected: boolean;
  shareUrl: string;
  onSelect: (id: string) => void;
  fillAvailableSpace?: boolean;
  eager?: boolean;
}

const CARD_CLASS =
  "relative flex flex-col overflow-hidden rounded-md border bg-background-muted shadow-card transition-shadow hover:shadow-card-hover focus-within:shadow-focus";
const CARD_INACTIVE_CLASS = "border-border hover:border-primary-soft";
const CARD_ACTIVE_CLASS = "border-primary bg-primary";

const HEADER_CLASS =
  "pointer-events-none flex shrink-0 items-center pl-3 pr-12 py-2";
const HEADER_INACTIVE_CLASS = "bg-primary-tint";
const HEADER_ACTIVE_CLASS =
  "border-b border-primary-foreground/15 bg-primary-foreground/12";

const STATUS_CLASS =
  "flex items-center gap-1.5 font-mono text-meta font-bold uppercase";
const STATUS_INACTIVE_CLASS = "text-primary";
const STATUS_ACTIVE_CLASS = "text-primary-foreground";
const DOT_CLASS = "h-1.5 w-1.5 rounded-full bg-current";

const SHARE_BUTTON_CLASS =
  "absolute top-1 right-3 z-20 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border focus-visible:outline-none focus-visible:shadow-focus";
const SHARE_INACTIVE_CLASS =
  "border-primary-soft bg-background text-primary hover:bg-primary-tint";
const SHARE_ACTIVE_CLASS =
  "border-primary-foreground/35 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25";

const BODY_CLASS = "pointer-events-none flex min-w-0 flex-1 flex-col p-3";
const CONTENT_ROW_CLASS = "flex min-w-0 gap-2.5";
const TEXT_CLASS = "flex min-w-0 flex-1 flex-col";

const THUMB_CLASS =
  "relative size-15 shrink-0 overflow-hidden rounded-sm aspect-square";
const THUMB_IMAGE_CLASS = "size-full object-cover";
const THUMB_FALLBACK_CLASS =
  "flex size-full items-center justify-center bg-media-placeholder text-foreground-tertiary";
const THUMB_FALLBACK_ACTIVE_CLASS =
  "bg-primary-foreground/15 text-primary-foreground/70";

const SELECT_CLASS =
  "absolute inset-0 z-10 w-full cursor-pointer rounded-md focus-visible:outline-none";

const TITLE_CLASS =
  "block min-w-0 truncate font-display text-caption font-semibold";
const TITLE_INACTIVE_CLASS = "text-foreground";
const TITLE_ACTIVE_CLASS = "text-primary-foreground";

const ADDRESS_CLASS = "mt-1 flex min-w-0 items-center gap-1 text-caption";
const ADDRESS_INACTIVE_CLASS = "text-foreground-tertiary";
const ADDRESS_ACTIVE_CLASS = "text-primary-foreground/70";

const RENT_ROW_CLASS = "mt-2 flex min-w-0 items-baseline justify-between gap-2";
const RENT_LABEL_CLASS = "min-w-0 truncate font-mono text-meta uppercase";
const RENT_LABEL_INACTIVE_CLASS = "text-foreground-tertiary";
const RENT_LABEL_ACTIVE_CLASS = "text-primary-foreground/65";
const RENT_CLASS = "shrink-0 font-display text-caption font-semibold";
const RENT_INACTIVE_CLASS = "text-foreground";
const RENT_ACTIVE_CLASS = "text-primary-foreground";

const BOTTOM_BLOCK_CLASS = "mt-auto block border-t pt-2.5";
const BOTTOM_BLOCK_INACTIVE_CLASS = "border-border";
const BOTTOM_BLOCK_ACTIVE_CLASS = "border-primary-foreground/20";

const APPLICATIONS_ROW_CLASS =
  "flex min-w-0 items-baseline justify-between gap-2";
const APPLICATIONS_LABEL_CLASS = "min-w-0 truncate text-caption";
const APPLICATIONS_LABEL_INACTIVE_CLASS = "text-foreground-secondary";
const APPLICATIONS_LABEL_ACTIVE_CLASS = "text-primary-foreground/80";
const APPLICATIONS_COUNT_CLASS =
  "shrink-0 font-mono text-meta font-bold whitespace-nowrap";
const APPLICATIONS_COUNT_INACTIVE_CLASS = "text-primary";
const APPLICATIONS_COUNT_ACTIVE_CLASS = "text-primary-foreground";

export function ObjectSidebarItem({
  object,
  selected,
  shareUrl,
  onSelect,
  fillAvailableSpace = true,
  eager = false,
}: ObjectSidebarItemProps) {
  const { sidebar, object: objectCopy } = dashboardCopy;
  const isDraft = object.status === "draft";

  const applicationsDisplay = objectCopy.applicationsValue(
    object.activeApplicationsCount,
  );
  const applicationsAriaLabel = applicationsDisplay;

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
        <span className={CONTENT_ROW_CLASS}>
          <span aria-hidden="true" className={THUMB_CLASS}>
            {object.coverImageUrl ? (
              <Image
                src={object.coverImageUrl}
                alt=""
                aria-hidden="true"
                width={192}
                height={192}
                quality={90}
                loading={eager ? "eager" : undefined}
                className={THUMB_IMAGE_CLASS}
              />
            ) : (
              <span
                className={cn(
                  THUMB_FALLBACK_CLASS,
                  selected && THUMB_FALLBACK_ACTIVE_CLASS,
                )}
              >
                <AppIcon icon={Home} size={18} strokeWidth={1.5} decorative />
              </span>
            )}
          </span>

          <span className={TEXT_CLASS}>
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
              <span className="min-w-0 truncate">{object.address}</span>
            </span>

            <span className={RENT_ROW_CLASS}>
              <span
                className={cn(
                  RENT_LABEL_CLASS,
                  selected
                    ? RENT_LABEL_ACTIVE_CLASS
                    : RENT_LABEL_INACTIVE_CLASS,
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
          </span>
        </span>

        <span
          className={cn(
            BOTTOM_BLOCK_CLASS,
            selected ? BOTTOM_BLOCK_ACTIVE_CLASS : BOTTOM_BLOCK_INACTIVE_CLASS,
          )}
        >
          <span className={APPLICATIONS_ROW_CLASS}>
            <span
              className={cn(
                APPLICATIONS_LABEL_CLASS,
                selected
                  ? APPLICATIONS_LABEL_ACTIVE_CLASS
                  : APPLICATIONS_LABEL_INACTIVE_CLASS,
              )}
            >
              {sidebar.applications}
            </span>
            <span
              className={cn(
                APPLICATIONS_COUNT_CLASS,
                selected
                  ? APPLICATIONS_COUNT_ACTIVE_CLASS
                  : APPLICATIONS_COUNT_INACTIVE_CLASS,
              )}
              aria-label={applicationsAriaLabel}
            >
              {applicationsDisplay}
            </span>
          </span>
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
          <AppIcon icon={Share2} size={12} strokeWidth={1.8} decorative />
        </button>
      )}
    </li>
  );
}
