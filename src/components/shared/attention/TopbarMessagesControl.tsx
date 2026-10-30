"use client";

import { MessageSquare } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { attentionCopy } from "@/lib/attention/copy";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { useGlobalAttention } from "@/lib/attention/hooks/use-global-attention";
import { AttentionCountBadge } from "./AttentionCountBadge";
import { GlobalAggregateMenu } from "./GlobalAggregateMenu";
import {
  TOPBAR_ICON_SIZE,
  TOPBAR_ICON_STROKE,
  TOPBAR_ICON_TRIGGER_CLASS,
} from "./topbar-icon-trigger";

interface TopbarMessagesControlProps {
  readonly role: GlobalAttentionRole;
}

export function TopbarMessagesControl({ role }: TopbarMessagesControlProps) {
  const {
    loading,
    error,
    messageCount,
    messageGroups,
    hasMore,
    loadMore,
    loadingMore,
    loadMoreError,
  } = useGlobalAttention(role);
  const showBadge = !loading && !error && messageCount > 0;
  const triggerAriaLabel = showBadge
    ? `${attentionCopy.messagesMenuTitle}: ${attentionCopy.unreadMessages(messageCount)}`
    : attentionCopy.messagesMenuTitle;

  if (loading || (!error && messageCount === 0)) {
    return null;
  }

  return (
    <PopoverPanel
      ariaLabel={attentionCopy.messagesMenuTitle}
      closeOnLinkClick
      align="right"
      panelClassName="mt-1.5"
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          type="button"
          className={TOPBAR_ICON_TRIGGER_CLASS}
          aria-label={triggerAriaLabel}
          title={triggerAriaLabel}
        >
          <AppIcon
            icon={MessageSquare}
            size={TOPBAR_ICON_SIZE}
            strokeWidth={TOPBAR_ICON_STROKE}
            decorative
          />
          {showBadge ? (
            <AttentionCountBadge count={messageCount} size="md" />
          ) : null}
        </button>
      )}
    >
      <GlobalAggregateMenu
        title={attentionCopy.messagesMenuTitle}
        loading={loading}
        error={error}
        errorCopy={attentionCopy.messagesMenuError}
        emptyCopy={attentionCopy.messagesMenuEmpty}
        loadMoreCopy={attentionCopy.globalMenuLoadMore}
        groups={messageGroups}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={loadMore}
        role={role}
      />
    </PopoverPanel>
  );
}
