import { cn } from "@/lib/utils/cn";

interface FlowStepProps {
  index: number;
  title: string;
  isCurrent: boolean;
  totalSteps: number;
  children?: React.ReactNode;
}

const ROW_BASE =
  "relative flex items-stretch gap-3.5 rounded-md border px-4 py-3.5";

const ROW_CURRENT = "border-primary bg-background shadow-tint-ring";
const ROW_IDLE = "border-border bg-background-subtle";

const NUM_BASE =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-caption font-medium";

const NUM_CURRENT = "bg-primary text-primary-foreground";
const NUM_IDLE = "bg-background-muted text-foreground-secondary";

const CONNECTOR =
  "after:absolute after:left-7 after:-bottom-3.5 after:h-3.5 after:w-px after:bg-border";

export function FlowStep({
  index,
  title,
  isCurrent,
  totalSteps,
  children,
}: FlowStepProps) {
  const isLast = index === totalSteps;
  const rowClass = cn(
    ROW_BASE,
    isCurrent ? ROW_CURRENT : ROW_IDLE,
    !isLast && CONNECTOR,
  );
  const numClass = cn(NUM_BASE, isCurrent ? NUM_CURRENT : NUM_IDLE);

  return (
    <div className={rowClass}>
      <span aria-hidden="true" className={numClass}>
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "font-display text-body font-medium text-foreground",
            !!children && "mb-2",
          )}
        >
          {title}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        )}
      </div>
    </div>
  );
}
