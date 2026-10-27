"use client";

import Link from "next/link";
import { setStoredSelectedObjectId } from "@/features/provider/dashboard/selected-object-storage";
import type {
  GlobalAttentionMenuGroup,
  GlobalAttentionRole,
} from "@/lib/attention/global-attention";
import { AttentionChip } from "./AttentionChip";

interface GlobalAggregateMenuProps {
  readonly title: string;
  readonly loading: boolean;
  readonly error: boolean;
  readonly errorCopy: string;
  readonly emptyCopy: string;
  readonly loadMoreCopy: string;
  readonly groups: readonly GlobalAttentionMenuGroup[];
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly loadMoreError: boolean;
  readonly onLoadMore: () => void;
  readonly role: GlobalAttentionRole;
}

const PANEL_CLASS = "w-80 max-w-[calc(100vw-2rem)] p-2";
const GROUP_CLASS = "rounded-md px-2 py-2";
const CHIP_ROW_CLASS =
  "flex w-full rounded-md px-1 py-1 text-left hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus";
const TITLE_CLASS = "truncate text-caption font-medium text-foreground";
const CITY_CLASS = "truncate text-meta text-foreground-secondary";

export function GlobalAggregateMenu({
  title,
  loading,
  error,
  errorCopy,
  emptyCopy,
  loadMoreCopy,
  groups,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  role,
}: GlobalAggregateMenuProps) {
  return (
    <div className={PANEL_CLASS}>
      <div className="mb-2 px-2">
        <p className="font-mono text-meta uppercase text-foreground-tertiary">
          {title}
        </p>
      </div>
      {loading ? (
        <p className="px-2 py-3 text-caption text-foreground-secondary">…</p>
      ) : error ? (
        <p className="px-2 py-3 text-caption text-foreground-secondary">
          {errorCopy}
        </p>
      ) : (
        <ul className="scrollbar-slim flex max-h-80 flex-col gap-3 overflow-y-auto overscroll-contain">
          {groups.length === 0 ? (
            <li>
              <p className="px-2 py-3 text-caption text-foreground-secondary">
                {emptyCopy}
              </p>
            </li>
          ) : (
            groups.map((group) => (
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
                        href={row.href}
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
            ))
          )}
          {hasMore ? (
            <li>
              {loadMoreError ? (
                <p
                  role="alert"
                  className="px-1 text-caption text-foreground-secondary"
                >
                  {errorCopy}
                </p>
              ) : null}
              <button
                type="button"
                className={CHIP_ROW_CLASS}
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "…" : loadMoreCopy}
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
