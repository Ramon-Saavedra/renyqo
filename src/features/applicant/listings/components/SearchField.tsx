"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const ROTATION_MS = 3000;

const WRAPPER_CLASS = "relative w-full lg:min-w-0 lg:flex-1";

const INPUT_CLASS = "h-11 pl-10 pr-10 sm:pr-32";

const ICON_LEFT_CLASS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-tertiary";

const HINT_CLASS =
  "pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-2 text-caption text-foreground-tertiary sm:flex";

const HINT_PREFIX_CLASS = "font-mono text-meta uppercase";

const HINT_VALUE_CLASS =
  "text-foreground-secondary transition-opacity duration-300 motion-reduce:transition-none";

const CLEAR_CLASS =
  "absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function SearchField({ value, onChange }: SearchFieldProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const showHint = value.length === 0;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!showHint) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setExampleIndex(
          (current) => (current + 1) % listingsCopy.console.examples.length,
        );
        setVisible(true);
      }, 300);
    }, ROTATION_MS);

    return () => {
      window.clearInterval(id);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [showHint]);

  return (
    <div className={WRAPPER_CLASS}>
      <span aria-hidden="true" className={ICON_LEFT_CLASS}>
        <AppIcon icon={Search} size={15} strokeWidth={1.6} decorative />
      </span>
      <Input
        type="search"
        className={INPUT_CLASS}
        placeholder={listingsCopy.console.searchPlaceholder}
        aria-label={listingsCopy.console.searchAriaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {showHint ? (
        <span aria-hidden="true" className={HINT_CLASS}>
          <span className={HINT_PREFIX_CLASS}>
            {listingsCopy.console.examplePrefix}
          </span>
          <span
            className={HINT_VALUE_CLASS}
            style={{ opacity: visible ? 1 : 0 }}
          >
            {listingsCopy.console.examples[exampleIndex]}
          </span>
        </span>
      ) : (
        <button
          type="button"
          className={CLEAR_CLASS}
          aria-label={listingsCopy.console.searchClearLabel}
          onClick={() => onChange("")}
        >
          <AppIcon icon={X} size={14} strokeWidth={1.8} decorative />
        </button>
      )}
    </div>
  );
}
