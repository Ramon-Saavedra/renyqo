"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { attentionCopy } from "@/lib/attention/copy";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { useGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { setStoredSelectedObjectId } from "@/features/provider/dashboard/selected-object-storage";
import { AttentionCountBadge } from "./AttentionCountBadge";
import { AttentionChip } from "./AttentionChip";

interface TopbarAttentionControlProps {
  readonly role: GlobalAttentionRole;
}

const TRIGGER_CLASS =
  "relative inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background-muted px-2 text-foreground-secondary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const PANEL_CLASS = "w-80 max-w-[calc(100vw-2rem)] p-2";
const GROUP_CLASS = "rounded-md px-2 py-2";
const CHIP_ROW_CLASS =
  "flex w-full rounded-md px-1 py-1 text-left hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus";
const TITLE_CLASS = "truncate text-caption font-medium text-foreground";
const CITY_CLASS = "truncate text-meta text-foreground-secondary";

export function TopbarAttentionControl({ role }: TopbarAttentionControlProps) {
  const {
    loading,
    error,
    count,
    groups,
    hasMore,
    loadMore,
    loadingMore,
    loadMoreError,
  } = useGlobalAttention(role);
  const showBadge = !loading && !error && count > 0;
  const triggerAriaLabel = showBadge
    ? `${attentionCopy.globalMenuTitle}: ${attentionCopy.globalMenuAriaLabel(count)}`
    : attentionCopy.globalMenuTitle;

  if (!loading && !error && count === 0) {
    return null;
  }

  return (
    <PopoverPanel
      ariaLabel={attentionCopy.globalMenuTitle}
      closeOnLinkClick
      align="right"
      panelClassName="mt-1.5"
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          type="button"
          className={TRIGGER_CLASS}
          aria-label={triggerAriaLabel}
          title={triggerAriaLabel}
        >
          <AppIcon icon={Bell} size={16} strokeWidth={2} decorative />
          {showBadge ? (
            <AttentionCountBadge count={count} size="md" />
          ) : null}
        </button>
      )}
    >
      <div className={PANEL_CLASS}>
        <div className="mb-2 px-2">
          <p className="font-mono text-meta uppercase text-foreground-tertiary">
            {attentionCopy.globalMenuTitle}
          </p>
        </div>
        {loading ? (
          <p className="px-2 py-3 text-caption text-foreground-secondary">…</p>
        ) : error ? (
          <p className="px-2 py-3 text-caption text-foreground-secondary">
            {attentionCopy.globalMenuError}
          </p>
        ) : groups.length === 0 ? (
          <p className="px-2 py-3 text-caption text-foreground-secondary">
            {attentionCopy.globalMenuEmpty}
          </p>
        ) : (
          <ul className="scrollbar-slim flex max-h-80 flex-col gap-3 overflow-y-auto overscroll-contain">
            {groups.map((group) => (
              <li key={group.applicationId} className={GROUP_CLASS}>
                <div className="mb-1">
                  <p className={TITLE_CLASS}>{group.listingTitle}</p>
                  {group.listingCity ? (
                    <p className={CITY_CLASS}>{group.listingCity}</p>
                  ) : null}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {group.chips.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={group.href}
                        className={CHIP_ROW_CLASS}
                        onClick={() => {
                          if (role === "provider") {
                            setStoredSelectedObjectId(group.listingId);
                          }
                        }}
                      >
                        <AttentionChip
                          chip={row.chip}
                          className="w-fit max-w-full"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {hasMore ? (
              <li>
                {loadMoreError ? (
                  <p
                    role="alert"
                    className="px-1 text-caption text-foreground-secondary"
                  >
                    {attentionCopy.globalMenuError}
                  </p>
                ) : null}
                <button
                  type="button"
                  className={CHIP_ROW_CLASS}
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "…" : attentionCopy.globalMenuLoadMore}
                </button>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </PopoverPanel>
  );
}
