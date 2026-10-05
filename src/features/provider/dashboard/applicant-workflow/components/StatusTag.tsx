import { cn } from "@/lib/utils/cn";

export type WorkflowTone = "primary" | "neutral";

const TAG_TONE_CLASS: Record<WorkflowTone, string> = {
  primary: "border-primary-soft bg-primary-tint text-primary",
  neutral: "border-border bg-background-subtle text-foreground-secondary",
};

const DOT_TONE_CLASS: Record<WorkflowTone, string> = {
  primary: "border-primary bg-primary",
  neutral: "border-border-strong bg-border-strong",
};

interface StatusTagProps {
  readonly tone: WorkflowTone;
  readonly label: string;
  readonly className?: string;
}

export function StatusTag({ tone, label, className }: StatusTagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center whitespace-nowrap rounded-sm border px-2 text-caption font-medium",
        TAG_TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

interface ToneDotProps {
  readonly tone: WorkflowTone;
}

export function ToneDot({ tone }: ToneDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-1.75 w-1.75 shrink-0 rounded-full border",
        DOT_TONE_CLASS[tone],
      )}
    />
  );
}
