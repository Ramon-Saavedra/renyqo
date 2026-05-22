import { Fragment } from "react";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface StepperProps {
  steps: readonly string[];
  currentIndex: number;
  ariaLabel?: string;
  className?: string;
}

const BASE_CLASS =
  "flex items-center gap-3 font-mono text-meta uppercase text-foreground-tertiary";

export function Stepper({
  steps,
  currentIndex,
  ariaLabel = "Schritte",
  className,
}: StepperProps) {
  return (
    <nav aria-label={ariaLabel} className={cn(BASE_CLASS, className)}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        const isLast = index === steps.length - 1;
        return (
          <Fragment key={step}>
            {isActive && (
              <span
                aria-current="step"
                className="inline-flex items-center gap-2 text-primary"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                {step}
              </span>
            )}
            {isDone && (
              <span className="inline-flex items-center gap-2 text-foreground-secondary">
                <span
                  aria-hidden="true"
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground-secondary text-background"
                >
                  <AppIcon icon={Check} size={8} strokeWidth={3} decorative />
                </span>
                {step}
              </span>
            )}
            {!isActive && !isDone && <span>{step}</span>}
            {!isLast && (
              <span aria-hidden="true" className="h-px w-8 bg-border" />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
