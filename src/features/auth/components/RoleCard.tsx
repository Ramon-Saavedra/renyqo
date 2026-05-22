import { Check, type LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RotatingBenefits } from "./RotatingBenefits";
import { cn } from "@/lib/utils/cn";

interface RoleCardProps {
  kicker: string;
  title: string;
  description: string;
  points: readonly string[];
  benefits: readonly string[];
  benefitsDelay?: number;
  glyph: LucideIcon;
  active: boolean;
  onSelect: () => void;
}

export function RoleCard({
  kicker,
  title,
  description,
  points,
  benefits,
  benefitsDelay = 0,
  glyph,
  active,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-md border bg-card p-4 text-left shadow-card transition-colors focus-visible:outline-none focus-visible:shadow-focus",
        active ? "border-primary" : "border-border hover:border-border-strong",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.75 bg-primary"
        />
      )}

      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-meta uppercase text-foreground-tertiary">
          {kicker}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-colors",
            active ? "border-primary" : "border-border-strong",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full bg-primary transition-opacity",
              active ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-background-muted text-foreground",
        )}
      >
        <AppIcon icon={glyph} size={16} strokeWidth={1.6} decorative />
      </span>

      <h3 className="mb-6 font-display text-title font-medium text-foreground">
        {title}
      </h3>
      <p className="mb-8 text-body text-foreground-secondary">{description}</p>

      <ul className="mb-5 flex flex-col gap-2">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-center gap-2.5 text-caption text-foreground-secondary"
          >
            <span className="inline-flex shrink-0 text-primary">
              <AppIcon icon={Check} size={14} strokeWidth={1.6} decorative />
            </span>
            {point}
          </li>
        ))}
      </ul>

      <RotatingBenefits benefits={benefits} delay={benefitsDelay} />
    </button>
  );
}
