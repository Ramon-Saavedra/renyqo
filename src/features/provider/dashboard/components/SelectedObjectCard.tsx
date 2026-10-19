"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Home, Pencil, Share2, type LucideIcon } from "lucide-react";
import { buttonVariantClass } from "@/components/ui/button/Button";
import { DASHBOARD_PRIMARY_COLOR_CLASS } from "../dashboard-button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { OBJECT_TYPE_LABEL } from "@/lib/api/listings";
import {
  formatArea,
  formatEUR,
} from "@/features/provider/listings-overview/utils/format";
import { siteConfig } from "@/config/site";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { DASHBOARD_BLOCK_CLASS } from "./dashboard-layout";
import { ShareButtons } from "./ShareButtons";

interface SelectedObjectCardProps {
  object: DashboardObject;
}

const STATUS_DOT_CLASS: Record<DashboardObject["status"], string> = {
  published: "bg-success",
  draft: "bg-foreground-tertiary",
  paused: "bg-warning",
  archived: "bg-border-strong",
  rented: "bg-foreground-tertiary",
};

const STATUS_TEXT_CLASS: Record<DashboardObject["status"], string> = {
  published: "text-success",
  draft: "text-foreground-tertiary",
  paused: "text-warning",
  archived: "text-foreground-tertiary",
  rented: "text-foreground-secondary",
};

const ACTION_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-4 text-action font-medium max-sm:w-11 max-sm:justify-center max-sm:px-0";
const PRIMARY_ACTION_CLASS = `${ACTION_CLASS} ${DASHBOARD_PRIMARY_COLOR_CLASS}`;
const SECONDARY_ACTION_CLASS = `${ACTION_CLASS} ${buttonVariantClass("ghost")}`;
const DISABLED_SECONDARY_ACTION_CLASS = `${ACTION_CLASS} ${buttonVariantClass("ghost")} cursor-not-allowed disabled:opacity-50`;
const ACTION_LABEL_CLASS = "max-sm:sr-only";

function ActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <AppIcon icon={Icon} size={16} strokeWidth={1.7} decorative />;
}

export function SelectedObjectCard({ object }: SelectedObjectCardProps) {
  const { object: copy } = dashboardCopy;
  const isDraft = object.status === "draft";
  const shareClosed =
    object.status === "archived" || object.status === "rented";
  const shareUrl = `${siteConfig.url}/objekt/${object.id}`;
  const listingsHref = `/provider/listings?selected=${encodeURIComponent(
    object.id,
  )}`;

  const timestampValue = isDraft ? object.updatedAt : object.publishedAt;
  const timestampCaption = isDraft
    ? copy.updatedCaption
    : copy.publishedCaption;

  const facts = [
    { id: "rent", label: copy.coldRent, value: formatEUR(object.coldRent) },
    {
      id: "area",
      label: copy.livingArea,
      value: formatArea(object.livingArea),
    },
    { id: "rooms", label: copy.rooms, value: object.rooms },
    {
      id: "free",
      label: copy.availableFrom,
      value: object.availableFrom ?? copy.availableFromEmpty,
    },
  ];

  return (
    <section className={DASHBOARD_BLOCK_CLASS}>
      <h2 className="mb-section font-display text-heading-md font-medium text-foreground">
        {copy.sectionHeading}
      </h2>
      <div className="mb-section flex flex-wrap items-start gap-card-x">
        <div className="min-w-0 flex-1 basis-75">
          <span className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[object.status]}`}
            />
            <span
              className={`font-mono text-meta font-medium uppercase tracking-wide ${STATUS_TEXT_CLASS[object.status]}`}
            >
              {OBJECT_STATUS_LABEL[object.status]}
            </span>
            {object.objectType ? (
              <span className="font-mono text-meta uppercase tracking-wide text-foreground-tertiary">
                · {OBJECT_TYPE_LABEL[object.objectType]}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-card-x">
            {object.coverImageUrl ? (
              <Image
                src={object.coverImageUrl}
                alt=""
                aria-hidden="true"
                width={80}
                height={80}
                quality={90}
                className="h-20 w-20 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-background-muted text-foreground-tertiary"
              >
                <AppIcon icon={Home} size={26} strokeWidth={1.4} decorative />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="mb-1 text-heading-lg font-normal tracking-tight text-foreground text-pretty">
                {object.fullTitle}
              </h1>
              <p className="text-body text-foreground-secondary">
                {object.address}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={listingsHref}
            aria-label={copy.preview}
            title={copy.preview}
            className={SECONDARY_ACTION_CLASS}
          >
            <ActionIcon icon={Eye} />
            <span className={ACTION_LABEL_CLASS}>{copy.preview}</span>
          </Link>
          {shareClosed ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label={copy.share}
              title={copy.share}
              className={DISABLED_SECONDARY_ACTION_CLASS}
            >
              <ActionIcon icon={Share2} />
              <span className={ACTION_LABEL_CLASS}>{copy.share}</span>
            </button>
          ) : (
            <PopoverPanel
              ariaLabel={copy.share}
              align="right"
              panelClassName="mt-1.5"
              trigger={({ triggerProps, triggerRef }) => (
                <button
                  {...triggerProps}
                  ref={triggerRef}
                  title={copy.share}
                  className={SECONDARY_ACTION_CLASS}
                >
                  <ActionIcon icon={Share2} />
                  <span className={ACTION_LABEL_CLASS}>{copy.share}</span>
                </button>
              )}
            >
              <ShareButtons
                title={object.fullTitle}
                shareUrl={shareUrl}
                variant="popover"
              />
            </PopoverPanel>
          )}
          <Link
            href={`/provider/listings/${object.id}`}
            aria-label={copy.edit}
            title={copy.edit}
            className={PRIMARY_ACTION_CLASS}
          >
            <ActionIcon icon={Pencil} />
            <span className={ACTION_LABEL_CLASS}>{copy.edit}</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-card-x gap-y-card-y font-mono text-caption">
        {facts.map((fact) => (
          <span key={fact.id} className="inline-flex items-baseline gap-2">
            <span className="text-foreground-tertiary">{fact.label}</span>
            <span className="text-foreground">{fact.value}</span>
          </span>
        ))}
        {timestampValue ? (
          <span className="inline-flex items-baseline gap-2">
            <span className="text-foreground-tertiary">{timestampCaption}</span>
            <span className="text-foreground">{timestampValue}</span>
          </span>
        ) : null}
      </div>
    </section>
  );
}
