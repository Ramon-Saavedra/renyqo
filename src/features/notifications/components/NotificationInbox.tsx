"use client";

import { useState } from "react";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { selectDashboardListing } from "@/features/provider/dashboard/selected-object-storage";
import { notificationCopy } from "../copy";
import { useNotificationList } from "../hooks/useNotificationList";
import type { NotificationCategory } from "../api/schema";
import { groupNotifications } from "../model/group";
import { notificationHref } from "../model/href";
import { NotificationRow } from "./NotificationRow";

type NotificationFilter = "all" | "unread" | NotificationCategory;

const FILTERS: readonly NotificationFilter[] = [
  "all",
  "unread",
  "VIEWING",
  "DOCUMENTS",
  "APPLICATION",
];

const FILTER_CLASS =
  "rounded-md px-2 py-1 text-meta text-foreground-secondary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus aria-pressed:bg-background-subtle aria-pressed:text-foreground";

export function NotificationInbox({
  role,
  unreadCount,
  onRead,
  listingLabels,
}: {
  readonly role: GlobalAttentionRole;
  readonly unreadCount: number | null;
  readonly onRead: () => void;
  readonly listingLabels?: ReadonlyMap<string, string>;
}) {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const category = filter === "all" || filter === "unread" ? null : filter;
  const list = useNotificationList(true, category);
  const visible =
    filter === "unread"
      ? list.items.filter((item) => item.readAt === null)
      : list.items;
  const groups = groupNotifications(visible, listingLabels);

  const markOne = (id: string) => {
    void list.markOne(id).then(onRead);
  };

  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] p-2">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="font-mono text-meta uppercase text-foreground-tertiary">
          {notificationCopy.title}
        </p>
        {unreadCount !== null && unreadCount > 0 && list.asOf ? (
          <button
            type="button"
            className="text-meta text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus"
            onClick={() => {
              void list.markAll().then(onRead);
            }}
          >
            {notificationCopy.markAll}
          </button>
        ) : null}
      </div>
      <div className="mb-2 flex flex-wrap gap-1 px-1" role="group">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={FILTER_CLASS}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {notificationCopy.filters[item]}
          </button>
        ))}
      </div>
      {list.actionError ? (
        <p
          role="alert"
          className="px-2 pb-2 text-caption text-foreground-secondary"
        >
          {notificationCopy.actionError}
        </p>
      ) : null}
      {list.status === "loading" || list.status === "idle" ? (
        <p className="px-2 py-3 text-caption text-foreground-secondary">…</p>
      ) : list.status === "error" ? (
        <div className="px-2 py-3">
          <p role="alert" className="text-caption text-foreground-secondary">
            {notificationCopy.listError}
          </p>
          <button
            type="button"
            className="mt-2 text-caption text-foreground hover:underline focus-visible:outline-none focus-visible:shadow-focus"
            onClick={list.reload}
          >
            {notificationCopy.retry}
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-2 py-3 text-caption text-foreground-secondary">
          {filter === "unread"
            ? notificationCopy.emptyUnread
            : filter === "all"
              ? notificationCopy.emptyAll
              : notificationCopy.emptyCategory}
        </p>
      ) : (
        <ul className="scrollbar-slim flex max-h-80 flex-col gap-3 overflow-y-auto overscroll-contain">
          {groups.map((group) => (
            <li key={group.listingId}>
              <p className="px-2 text-meta text-foreground-tertiary">
                {group.label}
              </p>
              <div className="mt-1 flex flex-col gap-2">
                {group.applications.map((application) => (
                  <ul key={application.applicationId}>
                    {application.items.map((item) => (
                      <li key={item.id}>
                        <NotificationRow
                          item={item}
                          href={notificationHref(role, item.target)}
                          onOpen={() => {
                            if (role === "provider") {
                              selectDashboardListing(item.target.listingId);
                            }
                            if (item.readAt === null) markOne(item.id);
                          }}
                          onMarkRead={() => markOne(item.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.hasMore && list.status === "ready" ? (
        <div className="mt-1">
          {list.moreError ? (
            <p
              role="alert"
              className="px-2 text-caption text-foreground-secondary"
            >
              {notificationCopy.listError}
            </p>
          ) : null}
          <button
            type="button"
            className="w-full rounded-md px-2 py-1.5 text-left text-caption text-foreground-secondary hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus"
            onClick={() => void list.loadMore()}
            disabled={list.loadingMore}
          >
            {list.loadingMore ? "…" : notificationCopy.loadMore}
          </button>
        </div>
      ) : null}
    </div>
  );
}
