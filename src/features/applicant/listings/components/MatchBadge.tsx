import { cn } from "@/lib/utils/cn";

export type MatchBadgeTone = "new" | "match" | "no-match";

interface MatchBadgeProps {
  tone: MatchBadgeTone;
  children: React.ReactNode;
  className?: string;
}

const BASE_CLASS =
  "inline-flex h-5 items-center gap-1 rounded px-2 font-mono text-meta font-medium uppercase self-start";

const TONE_CLASS: Record<MatchBadgeTone, string> = {
  new: "bg-input text-foreground-secondary",
  match: "bg-success/30 text-success-vivid shadow-[0_0_6px_var(--success-vivid)]",
  "no-match": "bg-foreground-tertiary/15 text-foreground-secondary",
};

export function MatchBadge({ tone, children, className }: MatchBadgeProps) {
  return (
    <span className={cn(BASE_CLASS, TONE_CLASS[tone], className)}>
      <span
        aria-hidden="true"
        className="inline-block h-1 w-1 rounded-full bg-current"
      />
      {children}
    </span>
  );
}
