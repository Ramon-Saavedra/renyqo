import type { AttentionChipModel } from "@/lib/attention/chips";
import { AttentionChip } from "./AttentionChip";

interface AttentionIndicatorsProps {
  readonly chips: readonly AttentionChipModel[];
  readonly maxVisible?: number;
  readonly className?: string;
}

export function AttentionIndicators({
  chips,
  maxVisible = 4,
  className,
}: AttentionIndicatorsProps) {
  if (chips.length === 0) return null;
  const visible = chips.slice(0, maxVisible);
  const overflow = chips.length - visible.length;

  return (
    <span className={className ?? "flex flex-wrap gap-1.5"}>
      {visible.map((chip) => (
        <AttentionChip key={`${chip.kind}:${chip.label}`} chip={chip} />
      ))}
      {overflow > 0 ? (
        <span
          className="inline-flex items-center rounded-sm border border-border bg-background-muted px-2 py-0.5 text-caption text-foreground-secondary"
          aria-label={`${overflow} weitere Hinweise`}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
