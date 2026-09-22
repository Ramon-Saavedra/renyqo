import { cn } from "@/lib/utils/cn";

export type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  initials: string;
  label: string;
  size?: AvatarSize;
  className?: string;
}

const BASE_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-md bg-primary-soft font-display font-semibold text-primary";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-caption",
  md: "h-12 w-12 text-body",
  lg: "h-14.5 w-14.5 text-title",
};

export function Avatar({
  initials,
  label,
  size = "sm",
  className,
}: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(BASE_CLASS, SIZE_CLASS[size], className)}
    >
      {initials}
    </span>
  );
}
