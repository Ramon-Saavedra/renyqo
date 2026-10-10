import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { TONE_BADGE_CLASS, type Tone } from "../model/tone";

interface ToneBadgeProps {
  readonly tone: Tone;
  readonly icon?: LucideIcon;
  readonly label: string;
  readonly srPrefix?: string;
  readonly className?: string;
}

export function ToneBadge({
  tone,
  icon,
  label,
  srPrefix,
  className,
}: ToneBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption font-medium",
        TONE_BADGE_CLASS[tone],
        className,
      )}
    >
      {icon ? (
        <AppIcon icon={icon} size={13} strokeWidth={2} decorative />
      ) : null}
      <span>
        {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
        {label}
      </span>
    </span>
  );
}
