"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Eye,
  Home,
  Pencil,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { OBJECT_TYPE_LABEL } from "@/lib/api/listings";
import {
  formatArea,
  formatEUR,
} from "@/features/provider/listings-overview/utils/format";
import { REASON_LABELS } from "@/features/provider/listings-overview/components/AttentionPill";
import { siteConfig } from "@/config/site";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { ShareButtons } from "./ShareButtons";

interface SelectedObjectCardProps {
  object: DashboardObject;
}

const STATUS_DOT_CLASS: Record<DashboardObject["status"], string> = {
  published: "bg-success",
  draft: "bg-foreground-tertiary",
  paused: "bg-warning",
  archived: "bg-border-strong",
};

const STATUS_TEXT_CLASS: Record<DashboardObject["status"], string> = {
  published: "text-success",
  draft: "text-foreground-tertiary",
  paused: "text-warning",
  archived: "text-foreground-tertiary",
};

const ACTION_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-4 text-action font-medium";
const PRIMARY_ACTION_CLASS = `${ACTION_CLASS} bg-primary text-primary-foreground hover:bg-primary-hover`;
const SECONDARY_ACTION_CLASS = `${ACTION_CLASS} bg-transparent text-foreground-secondary hover:bg-background-muted hover:text-foreground`;
const DISABLED_SECONDARY_ACTION_CLASS = `${ACTION_CLASS} border border-border text-foreground-tertiary cursor-not-allowed`;

function resolveAttentionText(object: DashboardObject): string | null {
  if (!object.needsAttention || !object.attentionReason) return null;
  if (
    object.attentionReason === "open_questions" &&
    object.openQuestionsCount > 0
  ) {
    return dashboardCopy.attention.openQuestions(object.openQuestionsCount);
  }
  return REASON_LABELS[object.attentionReason];
}

function ActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <AppIcon icon={Icon} size={16} strokeWidth={1.7} decorative />;
}

export function SelectedObjectCard({ object }: SelectedObjectCardProps) {
  const { object: copy } = dashboardCopy;
  const isDraft = object.status === "draft";
  const isArchived = object.status === "archived";
  const shareUrl = `${siteConfig.url}/objekt/${object.id}`;
  const listingsHref = `/provider/listings?selected=${encodeURIComponent(
    object.id,
  )}`;

  const timestampValue = isDraft ? object.updatedAt : object.publishedAt;
  const timestampCaption = isDraft
    ? copy.updatedCaption
    : copy.publishedCaption;

  const attentionText = resolveAttentionText(object);

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
    <section className="mt-section py-parent-y">
      <h2 className="mb-parent-y font-display text-heading-md font-medium text-foreground">
        {copy.sectionHeading}
      </h2>
      <div className="flex flex-wrap items-start gap-card-x">
        <div className="min-w-0 flex-1 basis-75">
          <span className="flex items-center gap-2">
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
          <div className="mt-2 flex items-center gap-card-x">
            {object.coverImageUrl ? (
              <Image
                src={object.coverImageUrl}
                alt=""
                aria-hidden="true"
                width={80}
                height={80}
                quality={90}
                className="hidden h-20 w-20 shrink-0 rounded-md border border-border object-cover sm:block"
              />
            ) : (
              <div
                aria-hidden="true"
                className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-md bg-background-muted text-foreground-tertiary sm:flex"
              >
                <AppIcon icon={Home} size={26} strokeWidth={1.4} decorative />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-heading-lg font-normal tracking-tight text-foreground text-pretty">
                {object.fullTitle}
              </h1>
              <p className="mt-1 text-body text-foreground-secondary">
                {object.address}
              </p>
            </div>
          </div>
          {attentionText ? (
            <p
              role="status"
              className="mt-2.5 flex items-center gap-1.75 text-caption text-warning"
            >
              <AppIcon
                icon={AlertTriangle}
                size={14}
                strokeWidth={1.8}
                decorative
                className="shrink-0"
              />
              {attentionText}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={listingsHref} className={SECONDARY_ACTION_CLASS}>
            <ActionIcon icon={Eye} />
            {copy.preview}
          </Link>
          {isArchived ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={DISABLED_SECONDARY_ACTION_CLASS}
            >
              <ActionIcon icon={Share2} />
              {copy.share}
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
                  className={SECONDARY_ACTION_CLASS}
                >
                  <ActionIcon icon={Share2} />
                  {copy.share}
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
            className={PRIMARY_ACTION_CLASS}
          >
            <ActionIcon icon={Pencil} />
            {copy.edit}
          </Link>
        </div>
      </div>

      <div className="mt-parent-y flex flex-wrap gap-x-card-x gap-y-card-y font-mono text-caption">
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
