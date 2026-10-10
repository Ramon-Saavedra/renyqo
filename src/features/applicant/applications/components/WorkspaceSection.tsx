import { useId, type ReactNode, type Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface WorkspaceSectionProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly aside?: ReactNode;
  readonly highlighted?: boolean;
  readonly className?: string | undefined;
  readonly sectionRef?: Ref<HTMLElement>;
  readonly children: ReactNode;
}

export function WorkspaceSection({
  icon,
  title,
  aside,
  highlighted = false,
  className,
  sectionRef,
  children,
}: WorkspaceSectionProps) {
  const titleId = useId();

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={cn(
        "min-w-0 scroll-mt-6 overflow-hidden rounded-md border bg-background-muted transition-colors",
        highlighted ? "border-primary" : "border-border",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3.5 py-3.5 sm:px-5">
        <h2
          id={titleId}
          className="flex items-center gap-2 font-display text-lead font-semibold text-foreground"
        >
          <AppIcon
            icon={icon}
            size={17}
            strokeWidth={1.9}
            className="text-foreground-secondary"
            decorative
          />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
