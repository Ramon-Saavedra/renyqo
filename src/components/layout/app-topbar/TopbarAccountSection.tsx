"use client";

import { TopbarAttentionControl } from "@/components/shared/attention/TopbarAttentionControl";
import { TopbarMessagesControl } from "@/components/shared/attention/TopbarMessagesControl";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";

interface TopbarAccountSectionProps {
  readonly role: GlobalAttentionRole;
}

export function TopbarAccountSection({ role }: TopbarAccountSectionProps) {
  return (
    <div className="flex items-center gap-2">
      <TopbarMessagesControl role={role} />
      <NotificationBell role={role} />
      <TopbarAttentionControl role={role} />
      <AccountMenu />
    </div>
  );
}
