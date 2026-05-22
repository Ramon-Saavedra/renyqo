import { listingsCopy } from "../copy/listings";

interface BewerbungenMeterProps {
  filled: number;
  max: number;
}

const DOT_BASE = "h-1.5 w-1.5 rounded-full bg-background-muted";
const DOT_ON = "h-1.5 w-1.5 rounded-full bg-primary";

export function BewerbungenMeter({ filled, max }: BewerbungenMeterProps) {
  const label = listingsCopy.row.applicationsAria(filled, max);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < filled ? DOT_ON : DOT_BASE}
        />
      ))}
    </span>
  );
}
