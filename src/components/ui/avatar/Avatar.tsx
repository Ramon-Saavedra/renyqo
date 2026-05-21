interface AvatarProps {
  initials: string;
  label: string;
  className?: string;
}

const BASE_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft font-display text-caption font-semibold text-primary";

export function Avatar({ initials, label, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}
    >
      {initials}
    </span>
  );
}
