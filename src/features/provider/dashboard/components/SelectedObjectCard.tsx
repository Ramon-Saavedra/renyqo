import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Home, MapPin, Pencil, Share2 } from "lucide-react";
import { DateTimeBadge } from "@/components/ui/date-time-badge/DateTimeBadge";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  formatArea,
  formatEUR,
} from "@/features/provider/listings-overview/utils/format";
import { siteConfig } from "@/config/site";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { ShareButtons } from "./ShareButtons";

interface SelectedObjectCardProps {
  object: DashboardObject;
}

const CARD_CLASS =
  "mb-7 overflow-hidden rounded-md border border-primary bg-primary shadow-card";
const HEAD_CLASS =
  "flex flex-col gap-4 border-b border-primary-foreground/20 px-6 py-5 xl:flex-row xl:items-start xl:justify-between";
const HEAD_LEFT_CLASS = "flex min-w-0 gap-5";
const THUMB_CLASS =
  "hidden h-23 w-23 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15 text-primary-foreground/70 sm:flex";
const THUMB_IMAGE_CLASS =
  "hidden h-23 w-23 shrink-0 rounded-md border border-primary-foreground/20 object-cover sm:block";
const KICKER_CLASS =
  "inline-flex items-center gap-2 font-mono text-meta uppercase text-primary-foreground/80";
const KICKER_PIP_CLASS = "h-1.5 w-1.5 rounded-full bg-primary-foreground";
const KICKER_ROW_CLASS = "relative flex items-center justify-between gap-3";
const MOBILE_SHARE_WRAP_CLASS = "relative lg:hidden";
const MOBILE_SHARE_BUTTON_CLASS =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25 focus-visible:outline-none focus-visible:shadow-focus";
const MOBILE_SHARE_PANEL_CLASS = "absolute right-0 top-full z-20 pt-1.5";
const OBJ_TITLE_CLASS =
  "mb-1 pt-2 font-display text-heading-md font-medium text-primary-foreground xl:text-title";
const ADDR_CLASS =
  "flex items-center gap-1.5 text-body text-primary-foreground/80";
const ACTIONS_CLASS = "flex shrink-0 items-start gap-2";
const ACTION_CLASS =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25 focus-visible:outline-none focus-visible:shadow-focus";
const ACTION_ICON_SIZE = 15;
const ACTION_ICON_STROKE = 1.7;
const TIMESTAMP_WRAP_CLASS = "flex flex-col items-start gap-1";
const TIMESTAMP_BADGE_CLASS =
  "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground";
const TIMESTAMP_CAPTION_CLASS =
  "text-xs leading-tight text-primary-foreground/75";

const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-4 sm:grid-cols-3 xl:grid-cols-6";
const CELL_CLASS =
  "flex flex-col gap-1 xl:border-r xl:border-primary-foreground/20 xl:pr-4 xl:last:border-r-0 xl:last:pr-0";
const DT_CLASS = "font-mono text-meta uppercase text-primary-foreground/75";
const DD_CLASS = "font-display text-brand font-medium text-primary-foreground";
const STATUS_CLASS =
  "inline-flex items-center gap-1.5 font-display text-brand font-medium text-primary-foreground";
const STATUS_PIP_CLASS = "h-1.5 w-1.5 rounded-full bg-primary-foreground";

export function SelectedObjectCard({ object }: SelectedObjectCardProps) {
  const { object: copy } = dashboardCopy;
  const isDraft = object.status === "draft";
  const shareUrl = `${siteConfig.url}/objekt/${object.id}`;
  const listingsHref = `/provider/listings?selected=${encodeURIComponent(
    object.id,
  )}`;

  const timestampValue = isDraft ? object.updatedAt : object.publishedAt;
  const timestampCaption = isDraft
    ? copy.updatedCaption
    : copy.publishedCaption;

  const stats = [
    { id: "area", dt: copy.livingArea, dd: formatArea(object.livingArea) },
    { id: "rooms", dt: copy.rooms, dd: object.rooms },
    { id: "rent", dt: copy.coldRent, dd: formatEUR(object.coldRent) },
    {
      id: "free",
      dt: copy.availableFrom,
      dd: object.availableFrom ?? copy.availableFromEmpty,
    },
    {
      id: "apps",
      dt: copy.applications,
      dd: copy.applicationsValue(object.activeApplications),
    },
  ];
  const stopCardNavigation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <section className={CARD_CLASS}>
      <div className={HEAD_CLASS}>
        <div className={HEAD_LEFT_CLASS}>
          {object.coverImageUrl ? (
            <Image
              src={object.coverImageUrl}
              alt=""
              aria-hidden="true"
              width={184}
              height={184}
              quality={90}
              className={THUMB_IMAGE_CLASS}
            />
          ) : (
            <div aria-hidden="true" className={THUMB_CLASS}>
              <AppIcon icon={Home} size={28} strokeWidth={1.4} decorative />
            </div>
          )}
          <div className="min-w-0">
            <div className={KICKER_ROW_CLASS}>
              <span className={KICKER_CLASS}>
                <span aria-hidden="true" className={KICKER_PIP_CLASS} />
                {copy.kicker}
              </span>
              {!isDraft && (
                <details
                  className={MOBILE_SHARE_WRAP_CLASS}
                  onClick={stopCardNavigation}
                >
                  <summary
                    className={MOBILE_SHARE_BUTTON_CLASS}
                    aria-label={dashboardCopy.sidebar.share.copyAria}
                  >
                    <AppIcon
                      icon={Share2}
                      size={13}
                      strokeWidth={1.7}
                      decorative
                    />
                  </summary>
                  <div className={MOBILE_SHARE_PANEL_CLASS}>
                    <ShareButtons
                      title={object.fullTitle}
                      shareUrl={shareUrl}
                      variant="popover"
                    />
                  </div>
                </details>
              )}
            </div>
            <h2 className={OBJ_TITLE_CLASS}>{object.fullTitle}</h2>
            <span className={ADDR_CLASS}>
              <AppIcon
                icon={MapPin}
                size={13}
                strokeWidth={1.6}
                decorative
                className="text-primary-foreground/70"
              />
              {object.address}
            </span>
          </div>
        </div>

        <div className={ACTIONS_CLASS}>
          {timestampValue && (
            <span className={TIMESTAMP_WRAP_CLASS}>
              <DateTimeBadge
                value={timestampValue}
                title={`${timestampCaption} ${timestampValue}`}
                className={TIMESTAMP_BADGE_CLASS}
              />
              <span className={TIMESTAMP_CAPTION_CLASS}>
                {timestampCaption}
              </span>
            </span>
          )}
          <Link
            href="/provider/listings/new"
            className={ACTION_CLASS}
            aria-label={copy.edit}
            onClick={stopCardNavigation}
          >
            <AppIcon
              icon={Pencil}
              size={ACTION_ICON_SIZE}
              strokeWidth={ACTION_ICON_STROKE}
              decorative
            />
          </Link>
          <Link
            href={listingsHref}
            className={ACTION_CLASS}
            aria-label={copy.preview}
            onClick={stopCardNavigation}
          >
            <AppIcon
              icon={Eye}
              size={ACTION_ICON_SIZE}
              strokeWidth={ACTION_ICON_STROKE}
              decorative
            />
          </Link>
        </div>
      </div>

      <dl className={GRID_CLASS}>
        {stats.map((stat) => (
          <div key={stat.id} className={CELL_CLASS}>
            <dt className={DT_CLASS}>{stat.dt}</dt>
            <dd className={DD_CLASS}>{stat.dd}</dd>
          </div>
        ))}
        <div className={CELL_CLASS}>
          <dt className={DT_CLASS}>{copy.status}</dt>
          <dd>
            {isDraft ? (
              <span className="font-display text-brand font-medium text-primary-foreground/85">
                {OBJECT_STATUS_LABEL.draft}
              </span>
            ) : (
              <span className={STATUS_CLASS}>
                <span aria-hidden="true" className={STATUS_PIP_CLASS} />
                {OBJECT_STATUS_LABEL.published}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
