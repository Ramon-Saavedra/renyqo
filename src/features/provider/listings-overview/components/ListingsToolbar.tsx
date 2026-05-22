import { Search, X } from "lucide-react";
import { INPUT_BASE_CLASS } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingsCopy } from "../copy/listings";

interface ListingsToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

const WRAPPER_CLASS = "relative w-full max-w-md";

const INPUT_CLASS = `${INPUT_BASE_CLASS} h-10 pl-10 pr-10`;

const ICON_LEFT_CLASS =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-tertiary";

const CLEAR_CLASS =
  "absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function ListingsToolbar({ value, onChange }: ListingsToolbarProps) {
  return (
    <div className={WRAPPER_CLASS}>
      <span aria-hidden="true" className={ICON_LEFT_CLASS}>
        <AppIcon icon={Search} size={15} strokeWidth={1.6} decorative />
      </span>
      <input
        type="search"
        className={INPUT_CLASS}
        placeholder={listingsCopy.toolbar.searchPlaceholder}
        aria-label={listingsCopy.toolbar.searchAriaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className={CLEAR_CLASS}
          aria-label={listingsCopy.toolbar.searchClearLabel}
          onClick={() => onChange("")}
        >
          <AppIcon icon={X} size={14} strokeWidth={1.8} decorative />
        </button>
      )}
    </div>
  );
}
