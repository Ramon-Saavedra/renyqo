import { cn } from "@/lib/utils/cn";

export interface RenyqoLoadingDotsProps {
  /** Optional processing label rendered before the dots (already localized). */
  label?: string;
  className?: string;
}

/**
 * The "alignment dots" motif — three dots that settle into place while data is
 * being sorted or processed. Replaces spinners across the Renyqo loading system.
 */
export function RenyqoLoadingDots({ label, className }: RenyqoLoadingDotsProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.25 font-mono text-meta uppercase text-foreground-tertiary",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {label}
      <span className="align-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
