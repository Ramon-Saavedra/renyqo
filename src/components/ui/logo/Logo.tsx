import { Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

interface LogoProps {
  className?: string;
}

const BASE_CLASS =
  "inline-flex items-center gap-2.5 font-display text-brand font-semibold text-foreground";

export function Logo({ className }: LogoProps) {
  return (
    <span className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}>
      <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm bg-primary text-primary-foreground">
        <AppIcon icon={Home} size={14} strokeWidth={2} decorative />
      </span>
      renyqo
    </span>
  );
}
