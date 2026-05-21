import { type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

interface NoteProps {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const BASE_CLASS =
  "flex gap-3 rounded-md border border-border bg-background-subtle px-4 py-3.5 text-caption leading-normal text-foreground-secondary";

export function Note({ icon, children, className }: NoteProps) {
  return (
    <div className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}>
      <span className="shrink-0 pt-0.5 text-primary">
        <AppIcon icon={icon} size={16} strokeWidth={1.3} decorative />
      </span>
      <span>{children}</span>
    </div>
  );
}
