"use client";

import { Search, X } from "lucide-react";
import { INPUT_BASE_CLASS } from "@/components/ui/form/Input";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface DashboardSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  dense?: boolean;
}

const ICON_CLASS =
  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-foreground-tertiary";
const CLEAR_CLASS =
  "absolute top-1/2 right-2 -translate-y-1/2 inline-flex items-center justify-center rounded-sm text-foreground-tertiary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

export function DashboardSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
  dense = false,
}: DashboardSearchProps) {
  const inputClass = cn(
    INPUT_BASE_CLASS,
    dense ? "h-9 pr-9 pl-9 text-caption" : "h-10 pr-10 pl-10",
  );

  return (
    <div className="relative w-full">
      <span
        aria-hidden="true"
        className={cn(ICON_CLASS, dense ? "left-3" : "left-3.5")}
      >
        <AppIcon
          icon={Search}
          size={dense ? 13 : 15}
          strokeWidth={1.6}
          decorative
        />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={inputClass}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className={cn(CLEAR_CLASS, dense ? "h-6 w-6" : "h-7 w-7")}
        >
          <AppIcon
            icon={X}
            size={dense ? 13 : 14}
            strokeWidth={1.8}
            decorative
          />
        </button>
      )}
    </div>
  );
}
