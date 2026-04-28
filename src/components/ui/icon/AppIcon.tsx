import { type LucideIcon } from "lucide-react";

export interface AppIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  title?: string;
  disabled?: boolean;
  decorative?: boolean;
  className?: string;
  strokeWidth?: number;
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppIcon({
  icon: Icon,
  size = 16,
  color,
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
      className={joinClasses(
        "shrink-0",
        color,
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    />
  );
}
