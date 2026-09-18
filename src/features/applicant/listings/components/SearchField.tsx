"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";
import {
  LISTINGS_SEARCH_QUERY_MAX_LENGTH,
  clampListingsSearchQuery,
  normalizeListingsSearchQuery,
} from "../utils/listings-search-params";
import {
  SEARCH_CONSOLE_SEARCH_CLASS,
  SEARCH_CONSOLE_SEARCH_ICON_CLASS,
} from "./search-console-classes";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const INPUT_CLASS =
  "h-11 pl-10 pr-10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none";

const CLEAR_CLASS =
  "absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function SearchField({ value, onChange }: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const isEmpty = draft.length === 0;

  if (value !== prevValue) {
    setPrevValue(value);
    if (normalizeListingsSearchQuery(draft) !== value) {
      setDraft(value);
    }
  }

  return (
    <div className={SEARCH_CONSOLE_SEARCH_CLASS}>
      <span aria-hidden="true" className={SEARCH_CONSOLE_SEARCH_ICON_CLASS}>
        <AppIcon icon={Search} size={15} strokeWidth={1.6} decorative />
      </span>
      <Input
        type="search"
        className={INPUT_CLASS}
        placeholder={listingsCopy.console.searchPlaceholder}
        aria-label={listingsCopy.console.searchAriaLabel}
        value={draft}
        maxLength={LISTINGS_SEARCH_QUERY_MAX_LENGTH}
        onChange={(event) => {
          const next = clampListingsSearchQuery(event.target.value);
          setDraft(next);
          onChange(normalizeListingsSearchQuery(next));
        }}
      />
      {!isEmpty && (
        <button
          type="button"
          className={CLEAR_CLASS}
          aria-label={listingsCopy.console.searchClearLabel}
          onClick={() => {
            setDraft("");
            onChange("");
          }}
        >
          <AppIcon icon={X} size={14} strokeWidth={1.8} decorative />
        </button>
      )}
    </div>
  );
}
