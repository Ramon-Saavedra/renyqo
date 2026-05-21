import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-md border border-border-strong bg-background-subtle pr-9 pl-3.5 text-action text-foreground outline-none transition-colors transition-shadow hover:border-foreground-tertiary focus:border-primary focus:bg-background focus:shadow-focus";

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <span className="relative inline-flex w-full">
      <select
        className={className ? `${SELECT_CLASS} ${className}` : SELECT_CLASS}
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
