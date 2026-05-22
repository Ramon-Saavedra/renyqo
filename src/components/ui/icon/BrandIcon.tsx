import type { IconType } from "react-icons";
import { cn } from "@/lib/utils/cn";

export interface BrandIconProps {
  icon: IconType;
  size?: number;
  decorative?: boolean;
  title?: string;
  className?: string;
}

const BASE_CLASS = "shrink-0";

export function BrandIcon({
  icon: Icon,
  size = 16,
  decorative = false,
  title,
  className,
}: BrandIconProps) {
  const isDecorative = decorative || !title;

  return (
    <Icon
      size={size}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : title}
      role={isDecorative ? undefined : "img"}
      className={cn(BASE_CLASS, className)}
    />
  );
}
