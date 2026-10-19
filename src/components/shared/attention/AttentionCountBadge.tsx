import { cn } from "@/lib/utils/cn";
import "./attention-message-chip.css";

export function formatAttentionCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

type AttentionCountBadgeSize = "sm" | "md";
type AttentionCountBadgeVariant = "accent" | "primary";

interface AttentionCountBadgeProps {
  readonly count: number;
  readonly size?: AttentionCountBadgeSize;
  readonly variant?: AttentionCountBadgeVariant;
  readonly className?: string;
  readonly ariaHidden?: boolean;
}

const BASE =
  "inline-flex items-center justify-center rounded-full font-mono font-semibold leading-none tabular-nums";

const SIZE_CLASS: Record<AttentionCountBadgeSize, string> = {
  sm: cn(
    BASE,
    "absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 text-[10px]",
  ),
  md: cn(
    BASE,
    "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-meta tracking-normal",
  ),
};

/** Shared red (#C72300) or primary count dot for attention UI. */
export function AttentionCountBadge({
  count,
  size = "sm",
  variant = "accent",
  className,
  ariaHidden = true,
}: AttentionCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        SIZE_CLASS[size],
        variant === "accent"
          ? "rq-attention-count-badge"
          : "bg-primary text-background",
        className,
      )}
      aria-hidden={ariaHidden}
    >
      {formatAttentionCount(count)}
    </span>
  );
}
