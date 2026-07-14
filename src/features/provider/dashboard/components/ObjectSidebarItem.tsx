import { Share2 } from "lucide-react";
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
}

const ITEM_CLASS =
  "flex min-h-0 flex-1 cursor-pointer flex-col rounded-md border bg-primary px-3 py-2 focus-within:shadow-focus";
const INACTIVE_CLASS = "border-transparent";
const ACTIVE_CLASS = "border-foreground bg-primary-hover";

const SELECT_CLASS =
  "relative block min-h-0 w-full cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:shadow-focus";

const TITLE_BASE =
  "min-w-0 truncate font-display text-caption font-medium text-primary-foreground";

const STATUS_BASE =
  "shrink-0 rounded-sm bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground";

const META_BASE =
  "block min-w-0 truncate text-caption text-primary-foreground/80";

const CAND_BASE =
  "flex min-w-0 flex-1 items-center gap-1.5 text-caption text-primary-foreground/90";
const DETAIL_BAR_BASE =
  "flex items-center gap-2 border-t border-primary-foreground/20 pt-2";
const PRICE_CLASS =
  "shrink-0 font-display text-caption font-medium text-primary-foreground";
const SHARE_WRAP_CLASS = "ml-auto flex shrink-0 justify-end";
const SHARE_BUTTON_BASE =
  "inline-flex h-6.5 w-6.5 cursor-pointer items-center justify-center rounded-sm border border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground hover:border-primary-foreground/60 hover:bg-primary-foreground/25 focus-visible:outline-none focus-visible:shadow-focus";

export function ObjectSidebarItem({
  object,
  selected,
  shareUrl,
  onSelect,
}: ObjectSidebarItemProps) {
  const { sidebar } = dashboardCopy;
  const isDraft = object.status === "draft";
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
      className={cn(ITEM_CLASS, selected ? ACTIVE_CLASS : INACTIVE_CLASS)}
      onClick={() => onSelect(object.id)}
    >
      <button type="button" aria-pressed={selected} className={SELECT_CLASS}>
        <span className="mb-2 flex justify-end border-b border-primary-foreground/20 pb-2">
          <span className={STATUS_BASE}>
            {OBJECT_STATUS_LABEL[object.status]}
          </span>
        </span>

        <span className="mb-2 flex flex-col gap-1 border-b border-primary-foreground/20 pb-2">
          <span className={TITLE_BASE}>{object.title}</span>
          <span className={META_BASE}>{object.address}</span>
        </span>
      </button>

      <span className={DETAIL_BAR_BASE}>
        <span className={PRICE_CLASS}>
          {formatEUR(object.coldRent)} {sidebar.rentSuffix}
        </span>
        {isDraft ? (
          <span className="min-w-0 flex-1 truncate text-caption text-primary-foreground/90">
            {sidebar.draftNotice}
          </span>
        ) : (
          <span className={CAND_BASE}>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
            />
            <span className="min-w-0 truncate">
              {sidebar.applicationsLabel(object.activeApplications)}
            </span>
          </span>
        )}

        {!isDraft && (
          <span className={SHARE_WRAP_CLASS}>
            <button
              type="button"
              onClick={handleShare}
              className={SHARE_BUTTON_BASE}
              aria-label={sidebar.share.aria}
            >
              <AppIcon icon={Share2} size={12} strokeWidth={1.8} decorative />
            </button>
          </span>
        )}
      </span>
    </li>
  );
}
