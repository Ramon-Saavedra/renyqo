import { Fragment } from "react";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

export interface SectionStep {
  readonly id: string;
  readonly label: string;
}

interface SectionStepperProps {
  steps: ReadonlyArray<SectionStep>;
  activeId: string;
  completedIds: ReadonlyArray<string>;
  ariaLabel?: string;
  className?: string;
}

const NAV_BASE = "flex items-center gap-0 border-y border-border py-3.5";

const STEP_BASE =
  "flex flex-1 min-w-0 items-center gap-2.5 font-mono text-meta uppercase text-foreground-tertiary no-underline transition-colors";
const STEP_ACTIVE = "text-foreground";
const STEP_DONE = "text-foreground-secondary";

const NUM_BASE =
  "grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full border border-border-strong bg-background font-mono text-meta leading-none tracking-normal text-foreground-tertiary";
const NUM_ACTIVE = "border-primary bg-primary text-primary-foreground";
const NUM_DONE = "border-primary bg-background text-primary";

const LINE_CLASS = "mx-3.5 h-px min-w-3.5 flex-1 bg-border";

export function SectionStepper({
  steps,
  activeId,
  completedIds,
  ariaLabel = "Fortschritt",
  className,
}: SectionStepperProps) {
  const navClass = className ? `${NAV_BASE} ${className}` : NAV_BASE;
  return (
    <nav aria-label={ariaLabel} className={navClass}>
      {steps.map((step, index) => {
        const isActive = step.id === activeId;
        const isDone = completedIds.includes(step.id);
        const stepClass = `${STEP_BASE} ${isActive ? STEP_ACTIVE : isDone ? STEP_DONE : ""}`;
        const numClass = `${NUM_BASE} ${
          isActive ? NUM_ACTIVE : isDone ? NUM_DONE : ""
        }`;
        const display = String(index + 1).padStart(2, "0");
        return (
          <Fragment key={step.id}>
            <a href={`#${step.id}`} className={stepClass.trim()}>
              <span aria-hidden="true" className={numClass.trim()}>
                {isDone ? (
                  <AppIcon icon={Check} size={11} strokeWidth={2} decorative />
                ) : (
                  display
                )}
              </span>
              <span>{step.label}</span>
            </a>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className={LINE_CLASS} />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
