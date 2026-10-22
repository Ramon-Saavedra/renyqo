import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { AttentionChipModel } from "@/lib/attention/chips";
import { AttentionCountBadge } from "./AttentionCountBadge";

const BASE_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption";

const MESSAGE_CHIP_CLASS =
  "rq-attention-message-chip border border-primary-soft bg-conversation-surface font-medium text-primary dark:border-border-strong dark:bg-primary-tint dark:text-foreground-secondary";

const MESSAGE_ICON_PILL_CLASS =
  "rq-attention-message-icon-pill inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border border-primary-soft bg-conversation-surface px-1.5 text-caption font-semibold text-primary shadow-sm dark:border-border-strong dark:bg-primary-tint dark:text-foreground-secondary";

interface AttentionChipProps {
  readonly chip: AttentionChipModel;
  readonly className?: string;
}

export function AttentionChip({ chip, className }: AttentionChipProps) {
  const isMessage = chip.kind === "messages";

  return (
    <span
      className={cn(
        BASE_CLASS,
        isMessage
          ? MESSAGE_CHIP_CLASS
          : chip.emphasis
            ? "border-primary-soft bg-primary-tint font-semibold text-primary"
            : "border-border bg-background-muted font-normal text-foreground",
        className,
      )}
    >
      <AppIcon icon={chip.icon} size={14} decorative />
      {chip.label}
    </span>
  );
}

interface AttentionIconBadgeProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly count?: number;
  readonly variant?: "pill" | "minimal";
  readonly tone?: "default" | "message";
  readonly accentCount?: boolean;
  readonly className?: string;
}

const ICON_BADGE_PILL_CLASS =
  "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border border-primary-soft bg-primary-tint px-1.5 text-caption font-semibold text-primary shadow-sm";

const ICON_BADGE_MINIMAL_CLASS =
  "relative inline-flex h-6 w-6 shrink-0 items-center justify-center text-foreground-secondary";

const MESSAGE_ICON_MINIMAL_CLASS =
  "rq-attention-message-icon-minimal text-primary dark:text-foreground-secondary";

export function AttentionIconBadge({
  icon,
  label,
  count,
  variant = "pill",
  tone = "default",
  accentCount,
  className,
}: AttentionIconBadgeProps) {
  const isMessage = tone === "message";
  const useAccentCount = accentCount ?? isMessage;
  const isMinimal = variant === "minimal";
  const showCount =
    count !== undefined && count > 0 && (isMinimal ? true : count > 1);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        isMinimal
          ? cn(
              ICON_BADGE_MINIMAL_CLASS,
              isMessage && MESSAGE_ICON_MINIMAL_CLASS,
            )
          : isMessage
            ? MESSAGE_ICON_PILL_CLASS
            : ICON_BADGE_PILL_CLASS,
        className,
      )}
    >
      <AppIcon
        icon={icon}
        size={isMinimal ? 15 : 14}
        strokeWidth={2}
        decorative
      />
      {showCount ? (
        isMinimal ? (
          <AttentionCountBadge
            count={count}
            variant={useAccentCount ? "accent" : "primary"}
          />
        ) : (
          <span className="font-mono text-meta tabular-nums">{count}</span>
        )
      ) : null}
    </span>
  );
}
