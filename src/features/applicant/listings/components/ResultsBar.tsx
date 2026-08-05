"use client";

import { listingsCopy } from "../copy/listings";
import type { SortKey } from "../types";
import { SortMenu } from "./SortMenu";

interface ResultsBarProps {
  count: number;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}

const WRAPPER_CLASS = "mt-7 mb-4 flex items-center justify-between gap-4";

const COUNT_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";

export function ResultsBar({ count, sort, onSortChange }: ResultsBarProps) {
  return (
    <div className={WRAPPER_CLASS}>
      <span className={COUNT_CLASS} aria-live="polite">
        {listingsCopy.results.count(count)}
      </span>
      <SortMenu value={sort} onChange={onSortChange} />
    </div>
  );
}
