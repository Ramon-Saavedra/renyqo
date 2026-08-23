import { cn } from "@/lib/utils/cn";

export type MatchBadgeTone = "new" | "match" | "no-match" | "incomplete";

export type MatchBadgeSize = "sm" | "md";

interface MatchBadgeProps {
  tone: MatchBadgeTone;
  size?: MatchBadgeSize;
  children: React.ReactNode;
  className?: string;
}

const BASE_CLASS = "inline-flex items-center self-start font-medium";

const SIZE_CLASS: Record<MatchBadgeSize, string> = {
  sm: "h-5 gap-1 rounded-sm px-2 font-mono text-meta uppercase",
  md: "h-11 gap-2 rounded-md px-4 text-caption",
};

const DOT_SIZE_CLASS: Record<MatchBadgeSize, string> = {
  sm: "h-1 w-1",
  md: "h-1.5 w-1.5",
};

const TONE_CLASS: Record<MatchBadgeTone, string> = {
  new: "bg-input text-foreground-secondary",
  match:
    "bg-success/30 text-success-vivid shadow-[0_0_6px_var(--success-vivid)]",
  "no-match": "bg-foreground-tertiary/15 text-foreground-secondary",
  incomplete: "bg-warning/25 text-warning shadow-[0_0_6px_var(--warning)]",
};

export function MatchBadge({
  tone,
  size = "sm",
  children,
  className,
}: MatchBadgeProps) {
  return (
    <span
      className={cn(BASE_CLASS, SIZE_CLASS[size], TONE_CLASS[tone], className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block shrink-0 rounded-full bg-current",
          DOT_SIZE_CLASS[size],
        )}
      />
      {children}
    </span>
  );
}
