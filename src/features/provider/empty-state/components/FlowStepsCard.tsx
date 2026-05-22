import { cn } from "@/lib/utils/cn";
import type { FlowStepCopy, StepPreview } from "../copy/empty-state";
import { FlowStep } from "./FlowStep";

interface FlowStepsCardProps {
  kicker: string;
  steps: ReadonlyArray<FlowStepCopy>;
  currentIndex: number;
}

function StepChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4.5 items-center rounded-sm border border-border bg-background px-2 font-mono text-meta font-medium uppercase text-foreground-tertiary">
      {children}
    </span>
  );
}

function StepBar({ widthClass }: { widthClass: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-1.5 rounded-full bg-border ${widthClass}`}
    />
  );
}

function StepDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 rounded-full bg-border-strong"
    />
  );
}

function StepFlexBar() {
  return (
    <span
      aria-hidden="true"
      className="h-1.5 min-w-12 flex-1 rounded-full bg-border"
    />
  );
}

function StepPreviewContent({ preview }: { preview: StepPreview }) {
  if (preview.kind === "property-chips") {
    return (
      <>
        {preview.labels.map((label) => (
          <StepChip key={label}>{label}</StepChip>
        ))}
        <StepFlexBar />
      </>
    );
  }

  if (preview.kind === "criteria-fields") {
    return (
      <>
        <StepBar widthClass="w-16" />
        <StepDot />
        <StepBar widthClass="w-12" />
        <StepDot />
        <StepBar widthClass="w-20" />
      </>
    );
  }

  return (
    <>
      <StepFlexBar />
      <StepFlexBar />
      <StepFlexBar />
    </>
  );
}

export function FlowStepsCard({
  kicker,
  steps,
  currentIndex,
}: FlowStepsCardProps) {
  return (
    <aside
      aria-label={kicker}
      className="rounded-md border border-border bg-background p-7"
    >
      <div className="mb-5.5 flex items-center justify-between">
        <span className="font-mono text-meta uppercase text-foreground-tertiary">
          {kicker}
        </span>
        <span aria-hidden="true" className="flex items-center gap-1">
          {steps.map((step, position) => (
            <span
              key={step.index}
              className={cn(
                "h-0.75 w-3.5 rounded-full",
                position === currentIndex ? "bg-primary" : "bg-border-strong",
              )}
            />
          ))}
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        {steps.map((step, position) => (
          <FlowStep
            key={step.index}
            index={step.index}
            title={step.title}
            isCurrent={position === currentIndex}
            totalSteps={steps.length}
          >
            <StepPreviewContent preview={step.preview} />
          </FlowStep>
        ))}
      </div>
    </aside>
  );
}
