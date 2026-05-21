import { type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <article className="rounded-md border border-border bg-background px-5 pt-5 pb-4.5">
      <span
        aria-hidden="true"
        className="mb-3.5 inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary-tint text-primary"
      >
        <AppIcon icon={icon} size={16} strokeWidth={1.6} decorative />
      </span>
      <h3 className="mb-1.5 font-display text-body font-medium text-foreground">
        {title}
      </h3>
      <p className="text-caption text-foreground-secondary">{description}</p>
    </article>
  );
}
