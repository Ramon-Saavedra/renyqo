import { cn } from "@/lib/utils/cn";
import { FlowStep } from "./FlowStep";

interface FlowStepsCardProps {
  kicker: string;
  steps: ReadonlyArray<{ index: number; title: string }>;
  currentIndex: number;
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4.5 items-center rounded-sm border border-border bg-background px-2 font-mono text-meta font-medium uppercase text-foreground-tertiary">
      {children}
    </span>
  );
}

function MiniBar({ widthClass }: { widthClass: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-1.5 rounded-full bg-border ${widthClass}`}
    />
  );
}

function MiniDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 rounded-full bg-border-strong"
    />
  );
}

function FlexBar() {
  return (
    <span
      aria-hidden="true"
      className="h-1.5 min-w-12 flex-1 rounded-full bg-border"
    />
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
        {steps.map((step, position) => {
          const isCurrent = position === currentIndex;
          return (
            <FlowStep
              key={step.index}
              index={step.index}
              title={step.title}
              isCurrent={isCurrent}
              totalSteps={steps.length}
            >
              {position === 0 && (
                <>
                  <MiniChip>Adresse</MiniChip>
                  <MiniChip>Größe</MiniChip>
                  <MiniChip>Miete</MiniChip>
                  <FlexBar />
                </>
              )}
              {position === 1 && (
                <>
                  <MiniBar widthClass="w-16" />
                  <MiniDot />
                  <MiniBar widthClass="w-12" />
                  <MiniDot />
                  <MiniBar widthClass="w-20" />
                </>
              )}
              {position === 2 && (
                <>
                  <FlexBar />
                  <FlexBar />
                  <FlexBar />
                </>
              )}
            </FlowStep>
          );
        })}
      </div>
    </aside>
  );
}
