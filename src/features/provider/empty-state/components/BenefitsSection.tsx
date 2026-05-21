import { BenefitCard } from "./BenefitCard";
import { type BenefitCopy } from "../copy/empty-state";

interface BenefitsSectionProps {
  title: string;
  description: string;
  items: readonly BenefitCopy[];
  className?: string;
}

export function BenefitsSection({
  title,
  description,
  items,
  className,
}: BenefitsSectionProps) {
  const base = "relative z-1 border-t border-border pt-10";
  return (
    <section className={className ? `${base} ${className}` : base}>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="font-display text-heading-md font-medium text-foreground">
          {title}
        </h2>
        <p className="max-w-sm text-caption text-foreground-tertiary">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <BenefitCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}
