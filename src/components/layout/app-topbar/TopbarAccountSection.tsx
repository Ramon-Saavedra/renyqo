"use client";

import { TopbarAttentionControl } from "@/components/shared/attention/TopbarAttentionControl";
import { TopbarMessagesControl } from "@/components/shared/attention/TopbarMessagesControl";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import type { ComponentProps } from "react";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";

interface TopbarAccountSectionProps {
  readonly role: GlobalAttentionRole;
  readonly accountMenu?: ComponentProps<typeof AccountMenu>;
}

export function TopbarAccountSection({
  role,
  accountMenu = {},
}: TopbarAccountSectionProps) {
  return (
    <div className="flex items-center gap-2">
      <TopbarMessagesControl role={role} />
      <NotificationBell role={role} />
      <TopbarAttentionControl role={role} />
      <AccountMenu {...accountMenu} />
    </div>
  );
}
