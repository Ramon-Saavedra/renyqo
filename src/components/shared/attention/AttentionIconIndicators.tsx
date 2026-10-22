import {
  groupAttentionChipsForIcons,
  type AttentionChipModel,
} from "@/lib/attention/chips";
import { attentionIconGroupUsesAccentCount } from "./attention-accent-count";
import { AttentionIconBadge } from "./AttentionChip";

interface AttentionIconIndicatorsProps {
  readonly chips: readonly AttentionChipModel[];
  readonly className?: string;
}

export function AttentionIconIndicators({
  chips,
  className,
}: AttentionIconIndicatorsProps) {
  if (chips.length === 0) return null;

  const groups = groupAttentionChipsForIcons(chips);

  return (
    <span className={className ?? "inline-flex items-center gap-1"}>
      {groups.map((group) => (
        <AttentionIconBadge
          key={group.id}
          icon={group.icon}
          label={group.label}
          count={group.count}
          variant="minimal"
          tone={group.kind === "messages" ? "message" : "default"}
          accentCount={attentionIconGroupUsesAccentCount(group.id)}
        />
      ))}
    </span>
  );
}
