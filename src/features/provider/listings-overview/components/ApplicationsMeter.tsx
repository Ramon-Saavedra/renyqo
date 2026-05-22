import { User } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";

interface ApplicationsMeterProps {
  active: number;
}

const APPLICATIONS_MAX = 5;
const ICON_ACTIVE = "text-success-vivid";
const ICON_INACTIVE = "text-foreground-tertiary";

export function ApplicationsMeter({ active }: ApplicationsMeterProps) {
  const label = listingsCopy.row.applicationsAria(active);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: APPLICATIONS_MAX }).map((_, i) => (
        <AppIcon
          key={i}
          icon={User}
          size={13}
          strokeWidth={1.5}
          decorative
          className={cn(i < active ? ICON_ACTIVE : ICON_INACTIVE)}
        />
      ))}
    </span>
  );
}
