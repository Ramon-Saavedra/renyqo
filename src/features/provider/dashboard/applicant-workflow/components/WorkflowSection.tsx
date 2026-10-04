import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

interface WorkflowSectionProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}

export function WorkflowSection({
  icon,
  title,
  aside,
  children,
}: WorkflowSectionProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 overflow-hidden rounded-md border border-border bg-background-muted"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5">
        <AppIcon
          icon={icon}
          size={15}
          strokeWidth={2}
          className="text-primary"
          decorative
        />
        <h3
          id={titleId}
          className="font-display text-action font-semibold text-foreground"
        >
          {title}
        </h3>
        <span className="flex-1" />
        {aside}
      </div>
      {children}
    </section>
  );
}
