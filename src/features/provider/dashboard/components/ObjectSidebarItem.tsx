import { formatEUR } from "@/features/provider/listings-overview/utils/format";
import { cn } from "@/lib/utils/cn";
import { dashboardCopy, OBJECT_STATUS_LABEL } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { ShareButtons } from "./ShareButtons";

interface ObjectSidebarItemProps {
  object: DashboardObject;
  selected: boolean;
  shareUrl: string;
  onSelect: (id: string) => void;
}

const ITEM_CLASS =
  "flex min-h-0 flex-1 cursor-pointer flex-col rounded-md border px-3 py-2 focus-within:shadow-focus";
const INACTIVE_CLASS =
  "border-border bg-background hover:border-border-strong hover:bg-background-subtle";
const ACTIVE_CLASS = "border-primary shadow shadow-primary";

const SELECT_CLASS =
  "block min-h-0 w-full cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:shadow-focus";

const TITLE_BASE =
  "min-w-0 truncate font-display text-caption font-medium text-foreground";
const TITLE_ACTIVE = "text-primary";

const STATUS_BASE =
  "shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap";
const STATUS_PUBLISHED = "bg-primary-tint text-primary";
const STATUS_DRAFT = "bg-background-muted text-foreground-secondary";

const META_BASE =
  "mt-1 flex min-w-0 items-center gap-1.5 text-caption text-foreground-tertiary";

const CAND_BASE =
  "mt-1.5 flex items-center gap-1.5 text-caption text-foreground-secondary";

export function ObjectSidebarItem({
  object,
  selected,
  shareUrl,
  onSelect,
}: ObjectSidebarItemProps) {
  const { sidebar } = dashboardCopy;
  const isDraft = object.status === "draft";

  return (
    <li
      className={cn(ITEM_CLASS, selected ? ACTIVE_CLASS : INACTIVE_CLASS)}
      onClick={() => onSelect(object.id)}
    >
      <button type="button" aria-pressed={selected} className={SELECT_CLASS}>
        <span className="flex items-start justify-between gap-2.5">
          <span className={cn(TITLE_BASE, selected && TITLE_ACTIVE)}>
            {object.title}
          </span>
          <span
            className={cn(
              STATUS_BASE,
              object.status === "published" ? STATUS_PUBLISHED : STATUS_DRAFT,
            )}
          >
            {OBJECT_STATUS_LABEL[object.status]}
          </span>
        </span>

        <span className={META_BASE}>
          <span className="min-w-0 truncate">{object.district}</span>
          <span
            aria-hidden="true"
            className="h-0.5 w-0.5 rounded-full bg-border-strong"
          />
          <span className="shrink-0">
            {formatEUR(object.coldRent)} {sidebar.rentSuffix}
          </span>
        </span>

        {isDraft ? (
          <span className="mt-2 block text-caption text-foreground-tertiary">
            {sidebar.draftNotice}
          </span>
        ) : (
          <span className={CAND_BASE}>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
            {sidebar.applicationsLabel(object.activeApplications)}
          </span>
        )}
      </button>

      {!isDraft && (
        <ShareButtons
          title={object.fullTitle}
          shareUrl={shareUrl}
          variant="sidebar"
        />
      )}
    </li>
  );
}
