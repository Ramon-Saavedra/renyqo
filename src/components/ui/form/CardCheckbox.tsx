"use client";

import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { SAVED_FIELD_SUBTLE_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface CardCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  description?: React.ReactNode;
  saved?: boolean;
}

const WRAPPER_CLASS =
  "flex cursor-pointer items-start gap-3 rounded-md border bg-background-subtle px-3 py-3 transition-colors";
const BOX_CLASS =
  "mt-0.25 grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors";

export function CardCheckbox({
  id,
  checked,
  onChange,
  children,
  description,
  saved = false,
}: CardCheckboxProps) {
  const wrapperClass = cn(
    WRAPPER_CLASS,
    saved
      ? SAVED_FIELD_SUBTLE_CLASS
      : checked
        ? "border-border"
        : "border-border hover:border-border-strong",
  );

  const boxClass = cn(
    BOX_CLASS,
    checked
      ? "border-primary bg-primary"
      : "border-border-strong bg-background",
  );

  return (
    <label htmlFor={id} className={wrapperClass}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span aria-hidden="true" className={boxClass}>
        <AppIcon
          icon={Check}
          size={11}
          strokeWidth={2.5}
          decorative
          className={checked ? "text-primary-foreground" : "opacity-0"}
        />
      </span>
      <span
        className={cn(
          "text-caption leading-normal",
          !saved && "text-foreground",
        )}
      >
        {children}
        {description && (
          <span
            className={cn(
              "mb-0 mt-0.5 block text-caption",
              !saved && "text-foreground-tertiary",
            )}
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
