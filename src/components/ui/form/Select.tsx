import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  saved?: boolean;
}

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-md border border-border-strong bg-input pr-9 pl-3.5 text-action text-foreground outline-none transition-colors transition-shadow hover:border-foreground-tertiary focus:border-primary focus:bg-input focus:shadow-focus";

export function Select({
  className,
  saved = false,
  children,
  ...rest
}: SelectProps) {
  return (
    <span className="relative inline-flex w-full">
      <select
        className={cn(SELECT_CLASS, saved && SAVED_FIELD_CLASS, className)}
        {...rest}
      >
        {children}
      </select>
      <AppIcon
        icon={ChevronDown}
        size={14}
        strokeWidth={1.4}
        decorative
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-foreground-tertiary"
      />
    </span>
  );
}
