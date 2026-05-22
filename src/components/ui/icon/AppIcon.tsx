import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AppIconProps {
  icon: LucideIcon;
  size?: number;
  title?: string;
  disabled?: boolean;
  decorative?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function AppIcon({
  icon: Icon,
  size = 16,
  title,
  disabled = false,
  decorative = false,
  className,
  strokeWidth = 1.75,
}: AppIconProps) {
  const isDecorative = decorative || !title;

  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : title}
      role={isDecorative ? undefined : "img"}
      className={cn(
        "shrink-0",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    />
  );
}
