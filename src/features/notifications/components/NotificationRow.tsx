"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { formatDateTime } from "@/features/applicant/applications/model/format-date";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import type { NotificationItem } from "../api/schema";
import { notificationCopy } from "../copy";
import { notificationLabel } from "../model/labels";

const ROW_CLASS =
  "flex min-w-0 flex-1 flex-col gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus";

export function NotificationRow({
  item,
  href,
  onOpen,
  onMarkRead,
}: {
  readonly item: NotificationItem;
  readonly href: string;
  readonly onOpen: () => void;
  readonly onMarkRead: () => void;
}) {
  const unread = item.readAt === null;
  return (
    <div className="flex items-start gap-1">
      <Link href={href} className={ROW_CLASS} onClick={onOpen}>
        <span className="flex items-center gap-2">
          {unread ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0" />
          )}
          <span className="truncate text-caption font-medium text-foreground">
            {notificationLabel(item.type)}
          </span>
        </span>
        <span className="pl-3.5 text-meta text-foreground-tertiary">
          {formatDateTime(item.occurredAt)}
        </span>
      </Link>
      {unread ? (
        <button
          type="button"
          className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={notificationCopy.markRead}
          onClick={onMarkRead}
        >
          <AppIcon icon={Check} size={14} strokeWidth={2} decorative />
        </button>
      ) : null}
    </div>
  );
}
