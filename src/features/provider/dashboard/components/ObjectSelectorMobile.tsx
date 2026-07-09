import { formatEUR } from "@/features/provider/listings-overview/utils/format";
import { cn } from "@/lib/utils/cn";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";

interface ObjectSelectorMobileProps {
  objects: readonly DashboardObject[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const WRAP_CLASS = "mt-4 lg:hidden";
const HEAD_CLASS =
  "mb-2 font-mono text-meta uppercase text-foreground-tertiary";
const SCROLLER_CLASS = "scrollbar-slim flex gap-2 overflow-x-auto pb-1";
const EMPTY_CLASS =
  "rounded-md border border-border bg-background-subtle px-3.5 py-4 text-caption text-foreground-secondary";

const CARD_BASE =
  "w-56 shrink-0 cursor-pointer rounded-md border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:shadow-focus";
const CARD_INACTIVE =
  "border-border bg-background hover:border-border-strong hover:bg-background-subtle";
const CARD_ACTIVE = "border-primary bg-primary";

const TITLE_BASE =
  "truncate font-display text-caption font-medium text-foreground";
const TITLE_ACTIVE = "text-primary-foreground";

const STATUS_BASE =
  "shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-meta uppercase whitespace-nowrap";
const STATUS_PUBLISHED = "bg-primary-tint text-primary";
const STATUS_DRAFT = "bg-background-muted text-foreground-secondary";
const STATUS_ON_ACTIVE = "bg-primary-foreground/20 text-primary-foreground";

const META_BASE = "mt-1.5 truncate text-caption text-foreground-tertiary";
const META_ACTIVE = "text-primary-foreground/80";

const CAND_BASE = "mt-1.5 text-caption text-foreground-secondary";
const CAND_ACTIVE = "text-primary-foreground/90";

export function ObjectSelectorMobile({
  objects,
  totalCount,
  selectedId,
  onSelect,
}: ObjectSelectorMobileProps) {
  const { sidebar } = dashboardCopy;

  return (
    <div className={WRAP_CLASS}>
      <h2 className={HEAD_CLASS}>
        {sidebar.heading} · {totalCount}
      </h2>
      {objects.length === 0 ? (
        <p className={EMPTY_CLASS}>{sidebar.empty}</p>
      ) : (
        <div className={SCROLLER_CLASS}>
          {objects.map((object) => {
            const selected = object.id === selectedId;
            const isDraft = object.status === "draft";
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => onSelect(object.id)}
                aria-pressed={selected}
                className={cn(
                  CARD_BASE,
                  selected ? CARD_ACTIVE : CARD_INACTIVE,
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={cn(TITLE_BASE, selected && TITLE_ACTIVE)}>
                    {object.title}
                  </span>
                  <span
                    className={cn(
                      STATUS_BASE,
                      selected
                        ? STATUS_ON_ACTIVE
                        : object.status === "published"
                          ? STATUS_PUBLISHED
                          : STATUS_DRAFT,
                    )}
                  >
                    {OBJECT_STATUS_LABEL[object.status]}
                  </span>
                </span>
                <span
                  className={cn(META_BASE, selected && META_ACTIVE, "block")}
                >
                  {object.district} · {formatEUR(object.coldRent)}{" "}
                  {sidebar.rentSuffix}
                </span>
                <span
                  className={cn(CAND_BASE, selected && CAND_ACTIVE, "block")}
                >
                  {isDraft
                    ? sidebar.draftNotice
                    : sidebar.applicationsLabel(object.activeApplications)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
