"use client";

import { listingsCopy } from "../copy/listings";
import type { SortKey } from "../types";
import { SortMenu } from "./SortMenu";
import { LISTINGS_RESULTS_CLASS } from "./listings-layout-classes";

interface ResultsBarProps {
  count: number;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}

const COUNT_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";

export function ResultsBar({ count, sort, onSortChange }: ResultsBarProps) {
  return (
    <div className={LISTINGS_RESULTS_CLASS}>
      <span className={COUNT_CLASS} aria-live="polite">
        {listingsCopy.results.count(count)}
      </span>
      <SortMenu value={sort} onChange={onSortChange} />
    </div>
  );
}
