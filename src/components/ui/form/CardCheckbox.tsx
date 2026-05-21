"use client";

import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

interface CardCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  description?: React.ReactNode;
}

export function CardCheckbox({
  id,
  checked,
  onChange,
  children,
  description,
}: CardCheckboxProps) {
  const wrapperClass = `flex cursor-pointer items-start gap-3 rounded-md border bg-background-subtle px-3 py-3 transition-colors ${
    checked ? "border-border" : "border-border hover:border-border-strong"
  }`;

  const boxClass = `mt-0.25 grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors ${
    checked ? "border-primary bg-primary" : "border-border-strong bg-background"
  }`;

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
      <span className="text-caption leading-normal text-foreground">
        {children}
        {description && (
          <span className="mb-0 mt-0.5 block text-caption text-foreground-tertiary">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
