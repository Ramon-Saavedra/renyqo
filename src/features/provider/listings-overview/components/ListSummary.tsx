import { listingsCopy } from "../copy/listings";
import type { SortKey } from "../types";
import { SortMenu } from "./SortMenu";

interface ListSummaryProps {
  total: number;
  shown: number;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}

const WRAPPER_CLASS =
  "mb-3.5 flex flex-wrap items-center justify-between gap-2.5 px-1";

const LEFT_CLASS = "flex items-baseline gap-2.5";

const COUNT_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";

const FILTERED_CLASS = "text-caption text-foreground-tertiary";

export function ListSummary({
  total,
  shown,
  sort,
  onSortChange,
}: ListSummaryProps) {
  const noun = shown === 1 ? listingsCopy.summary.singular : listingsCopy.summary.plural;
  const isFiltered = shown !== total;
  return (
    <div className={WRAPPER_CLASS}>
      <div className={LEFT_CLASS}>
        <span className={COUNT_CLASS}>
          {shown} {noun}
        </span>
        {isFiltered && (
          <span className={FILTERED_CLASS}>
            {listingsCopy.summary.filteredOf(total)}
          </span>
        )}
      </div>
      <SortMenu value={sort} onChange={onSortChange} />
    </div>
  );
}
