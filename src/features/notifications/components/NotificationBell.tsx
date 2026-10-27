"use client";

import { Bell } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { AttentionCountBadge } from "@/components/shared/attention/AttentionCountBadge";
import {
  TOPBAR_ICON_SIZE,
  TOPBAR_ICON_STROKE,
  TOPBAR_ICON_TRIGGER_CLASS,
} from "@/components/shared/attention/topbar-icon-trigger";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { notificationCopy } from "../copy";
import { useNotificationUnreadCount } from "../hooks/useNotificationUnreadCount";
import { NotificationInbox } from "./NotificationInbox";

export function NotificationBell({
  role,
}: {
  readonly role: GlobalAttentionRole;
}) {
  const unread = useNotificationUnreadCount();
  const count = unread.count ?? 0;
  const label =
    count > 0
      ? `${notificationCopy.title}: ${notificationCopy.badge(count)}`
      : notificationCopy.title;

  return (
    <PopoverPanel
      ariaLabel={label}
      align="right"
      panelClassName="mt-1.5"
      closeOnLinkClick
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          type="button"
          className={TOPBAR_ICON_TRIGGER_CLASS}
          aria-label={label}
          title={label}
        >
          <AppIcon
            icon={Bell}
            size={TOPBAR_ICON_SIZE}
            strokeWidth={TOPBAR_ICON_STROKE}
            decorative
          />
          {count > 0 ? (
            <AttentionCountBadge count={count} size="md" variant="primary" />
          ) : null}
        </button>
      )}
    >
      <NotificationInbox
        role={role}
        unreadCount={unread.count}
        onRead={() => {
          void unread.refresh();
        }}
      />
    </PopoverPanel>
  );
}
