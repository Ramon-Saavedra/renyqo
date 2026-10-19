import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { AttentionChipModel } from "@/lib/attention/chips";

const BASE_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption";

interface AttentionChipProps {
  readonly chip: AttentionChipModel;
  readonly className?: string;
}

export function AttentionChip({ chip, className }: AttentionChipProps) {
  return (
    <span
      className={cn(
        BASE_CLASS,
        chip.emphasis
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
  readonly className?: string;
}

const ICON_BADGE_PILL_CLASS =
  "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border border-primary-soft bg-primary-tint px-1.5 text-caption font-semibold text-primary shadow-sm";

const ICON_BADGE_MINIMAL_CLASS =
  "relative inline-flex h-6 w-6 shrink-0 items-center justify-center text-foreground-secondary";

const COUNT_BADGE_CLASS =
  "absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 font-mono text-[10px] font-semibold leading-none text-background tabular-nums";

export function AttentionIconBadge({
  icon,
  label,
  count,
  variant = "pill",
  className,
}: AttentionIconBadgeProps) {
  const isMinimal = variant === "minimal";
  const showCount =
    count !== undefined && count > 0 && (isMinimal ? true : count > 1);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        isMinimal ? ICON_BADGE_MINIMAL_CLASS : ICON_BADGE_PILL_CLASS,
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
          <span className={COUNT_BADGE_CLASS} aria-hidden="true">
            {count > 9 ? "9+" : count}
          </span>
        ) : (
          <span className="font-mono text-meta tabular-nums">{count}</span>
        )
      ) : null}
    </span>
  );
}
