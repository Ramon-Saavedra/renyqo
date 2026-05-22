import { Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
}

const BASE_CLASS =
  "inline-flex items-center gap-2.5 font-display text-brand font-semibold text-foreground";

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn(BASE_CLASS, className)}>
      <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm bg-primary text-primary-foreground">
        <AppIcon icon={Home} size={14} strokeWidth={2} decorative />
      </span>
      renyqo
    </span>
  );
}
