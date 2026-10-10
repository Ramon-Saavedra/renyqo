import Link from "next/link";
import { ChevronRight, FileUp, MessageSquare } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { applicationsCopy } from "../../copy";
import type { OverviewCardModel } from "../../model/overview-card";
import { ListingThumbnail } from "../ListingThumbnail";
import { ToneBadge } from "../ToneBadge";

const INDICATOR_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption";

export function ApplicationCard({
  card,
}: {
  readonly card: OverviewCardModel;
}) {
  const hasIndicators = Boolean(
    card.pending || card.unread || card.missingDocuments || card.viewing,
  );

  return (
    <Link
      href={card.href}
      aria-label={card.ariaLabel}
      className="flex w-full items-center gap-3 rounded-md border border-border bg-background-muted p-3 text-foreground transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:shadow-focus sm:gap-4 sm:p-3.5"
    >
      <ListingThumbnail
        imageUrl={card.imageUrl}
        sizes="(min-width: 640px) 132px, 76px"
        fallbackLabel={applicationsCopy.overview.noImage}
        muted={card.status.group === "DONE"}
        className="w-19 sm:w-33"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
            <span className="font-display text-lead font-semibold text-pretty text-foreground">
              {card.title}
            </span>
            {card.location ? (
              <span className="text-body text-foreground-secondary">
                {card.location}
              </span>
            ) : null}
          </span>
          <ToneBadge
            tone={card.status.tone}
            icon={card.status.icon}
            label={card.status.label}
          />
        </span>
        <span className="text-caption text-foreground-tertiary">
          {card.dates}
        </span>
        {hasIndicators ? (
          <span className="flex flex-wrap gap-1.5">
            {card.pending ? (
              <span
                className={cn(
                  INDICATOR_CLASS,
                  "border-primary-soft bg-primary-tint font-semibold text-primary",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                {card.pending}
              </span>
            ) : null}
            {card.unread ? (
              <ToneBadge
                tone="neutral"
                icon={MessageSquare}
                label={card.unread}
                className="font-normal text-foreground"
              />
            ) : null}
            {card.missingDocuments ? (
              <ToneBadge
                tone="warning"
                icon={FileUp}
                label={card.missingDocuments}
                className="font-normal"
              />
            ) : null}
            {card.viewing ? (
              <ToneBadge
                tone="neutral"
                icon={card.viewing.icon}
                label={card.viewing.label}
                className="font-normal text-foreground"
              />
            ) : null}
          </span>
        ) : null}
      </span>
      <AppIcon
        icon={ChevronRight}
        size={18}
        className="hidden text-foreground-tertiary sm:block"
        decorative
      />
    </Link>
  );
}
