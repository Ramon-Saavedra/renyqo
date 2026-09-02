import { cn } from "@/lib/utils/cn";
import { dashboardCopy } from "../copy/dashboard";

interface StatCardsProps {
  totalObjects: number;
  publishedObjects: number;
  draftObjects: number;
  activeApplications: number;
}

const GRID_CLASS = "grid grid-cols-3 gap-1.5 md:max-w-2xl md:gap-2.5";
const CARD_CLASS =
  "flex min-h-16 flex-col justify-between gap-1 rounded-md border border-border bg-background-muted px-dashboard-card-x py-dashboard-card-y md:min-h-0 md:justify-start md:gap-0.5";
const LABEL_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";
const NUM_CLASS =
  "self-end text-right font-display text-brand font-medium tabular-nums text-foreground md:self-auto md:text-left md:text-heading-md";
const FOOT_CLASS =
  "mt-0.5 hidden items-center gap-1.5 text-caption text-foreground-secondary md:flex";
const PIP_CLASS = "h-1 w-1 rounded-full bg-primary";
const PIP_MUTED_CLASS = "h-1 w-1 rounded-full bg-border-strong";

export function StatCards({
  totalObjects,
  publishedObjects,
  draftObjects,
  activeApplications,
}: StatCardsProps) {
  const { stats } = dashboardCopy;

  const cards = [
    {
      id: "objects",
      label: stats.objects,
      num: totalObjects,
      foot: stats.objectsFoot(publishedObjects, draftObjects),
      muted: true,
    },
    {
      id: "active-applications",
      label: stats.activeApplications,
      num: activeApplications,
      foot: null,
      muted: false,
    },
    {
      id: "drafts",
      label: stats.drafts,
      num: draftObjects,
      foot: stats.draftsFoot,
      muted: true,
    },
  ];

  return (
    <div className={GRID_CLASS}>
      {cards.map((card) => (
        <div key={card.id} className={CARD_CLASS}>
          <span className={LABEL_CLASS}>{card.label}</span>
          <span className={NUM_CLASS}>{card.num}</span>
          {card.foot ? (
            <span className={FOOT_CLASS}>
              <span
                aria-hidden="true"
                className={cn(card.muted ? PIP_MUTED_CLASS : PIP_CLASS)}
              />
              {card.foot}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
