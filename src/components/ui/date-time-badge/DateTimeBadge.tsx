import { CalendarClock, type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface DateTimeBadgeProps {
  value: string;
  title?: string;
  icon?: LucideIcon;
  className?: string;
}

const BADGE_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-primary-soft bg-primary-tint px-2.5 text-caption font-medium tabular-nums text-primary";

export function DateTimeBadge({
  value,
  title,
  icon = CalendarClock,
  className,
}: DateTimeBadgeProps) {
  return (
    <span className={cn(BADGE_CLASS, className)} title={title}>
      <AppIcon icon={icon} size={15} strokeWidth={1.7} decorative />
      {value}
    </span>
  );
}
