import type { CardViewingSummary } from "./card-viewing";

export function CardViewingLines({
  summary,
}: {
  readonly summary: CardViewingSummary;
}) {
  return (
    <span className="flex flex-col gap-0.5 text-caption text-foreground-secondary">
      <span>{summary.primary}</span>
      {summary.secondary ? (
        <span className="text-foreground-tertiary">{summary.secondary}</span>
      ) : null}
    </span>
  );
}
