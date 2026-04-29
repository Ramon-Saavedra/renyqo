import { Fragment } from "react";

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
    <nav
      aria-label={ariaLabel}
      className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isLast = index === steps.length - 1;
        return (
          <Fragment key={step}>
            {isActive ? (
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
            ) : (
              <span>{step}</span>
            )}
            {!isLast && (
              <span aria-hidden="true" className="h-px w-8 bg-border" />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
