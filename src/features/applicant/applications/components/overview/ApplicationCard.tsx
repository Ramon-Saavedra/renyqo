import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AttentionIndicators } from "@/components/shared/attention/AttentionIndicators";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { applicationsCopy } from "../../copy";
import type { OverviewCardModel } from "../../model/overview-card";
import { ListingThumbnail } from "../ListingThumbnail";
import { ToneBadge } from "../ToneBadge";

export function ApplicationCard({
  card,
}: {
  readonly card: OverviewCardModel;
}) {
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
        {card.attentionChips.length > 0 ? (
          <AttentionIndicators chips={card.attentionChips} />
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
