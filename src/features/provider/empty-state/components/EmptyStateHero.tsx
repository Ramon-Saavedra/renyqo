import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { InfoPill } from "@/components/ui/info-pill/InfoPill";

interface EmptyStateHeroProps {
  welcome: string;
  title: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  trust: string;
}

export function EmptyStateHero({
  welcome,
  title,
  lead,
  ctaLabel,
  ctaHref,
  trust,
}: EmptyStateHeroProps) {
  return (
    <div className="max-w-xl">
      <InfoPill withPip className="mb-6">
        {welcome}
      </InfoPill>

      <h1 className="mb-4 font-display text-heading-xl font-medium text-balance text-foreground">
        {title}
      </h1>

      <p className="mb-7 max-w-lg text-lead text-foreground-secondary text-pretty">
        {lead}
      </p>

      <div className="mb-5.5 flex flex-wrap items-center gap-3.5">
        <Link href={ctaHref} className={buttonClass("primary")}>
          {ctaLabel}
          <AppIcon icon={ArrowRight} size={14} strokeWidth={1.8} decorative />
        </Link>
      </div>

      <InfoPill variant="body" icon={Lock}>
        {trust}
      </InfoPill>
    </div>
  );
}
