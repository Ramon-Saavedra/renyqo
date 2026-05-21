import { type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

export type InfoPillVariant = "mono" | "body";

interface InfoPillProps {
  children: React.ReactNode;
  variant?: InfoPillVariant;
  icon?: LucideIcon;
  withPip?: boolean;
  className?: string;
}

const BASE_CLASS =
  "inline-flex items-center gap-2 rounded-sm border border-border bg-background-subtle";

const VARIANT_CLASS: Record<InfoPillVariant, string> = {
  mono: "px-2.5 py-1.5 font-mono text-meta uppercase text-foreground-tertiary",
  body: "px-3 py-2 text-caption text-foreground-secondary",
};

export function InfoPill({
  children,
  variant = "mono",
  icon,
  withPip = false,
  className,
}: InfoPillProps) {
  const composed = `${BASE_CLASS} ${VARIANT_CLASS[variant]}`;
  return (
    <span className={className ? `${composed} ${className}` : composed}>
      {withPip && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
        />
      )}
      {icon && (
        <AppIcon
          icon={icon}
          size={13}
          strokeWidth={1.6}
          decorative
          className="text-primary"
        />
      )}
      {children}
    </span>
  );
}
