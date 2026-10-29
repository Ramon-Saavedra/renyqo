"use client";

import { TriangleAlert } from "lucide-react";
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

interface TopbarAttentionControlProps {
  readonly role: GlobalAttentionRole;
}

export function TopbarAttentionControl({ role }: TopbarAttentionControlProps) {
  const {
    loading,
    error,
    attentionCount,
    attentionGroups,
    hasMore,
    loadMore,
    loadingMore,
    loadMoreError,
  } = useGlobalAttention(role);
  const showBadge = !loading && !error && attentionCount > 0;
  const triggerAriaLabel = showBadge
    ? `${attentionCopy.globalMenuTitle}: ${attentionCopy.globalMenuAriaLabel(attentionCount)}`
    : attentionCopy.globalMenuTitle;

  if (!loading && !error && attentionCount === 0) {
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
          className={TOPBAR_ICON_TRIGGER_CLASS}
          aria-label={triggerAriaLabel}
          title={triggerAriaLabel}
        >
          <AppIcon
            icon={TriangleAlert}
            size={TOPBAR_ICON_SIZE}
            strokeWidth={TOPBAR_ICON_STROKE}
            decorative
          />
          {showBadge ? (
            <AttentionCountBadge count={attentionCount} size="md" />
          ) : null}
        </button>
      )}
    >
      <GlobalAggregateMenu
        title={attentionCopy.globalMenuTitle}
        loading={loading}
        error={error}
        errorCopy={attentionCopy.globalMenuError}
        emptyCopy={attentionCopy.globalMenuEmpty}
        loadMoreCopy={attentionCopy.globalMenuLoadMore}
        groups={attentionGroups}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={loadMore}
        role={role}
      />
    </PopoverPanel>
  );
}
