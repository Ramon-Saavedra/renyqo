import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> {
  id: string;
  children: ReactNode;
}

export function Checkbox({
  id,
  children,
  className,
  ...inputProps
}: CheckboxProps) {
  const copyId = `${id}-copy`;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 text-caption text-foreground-secondary",
        className,
      )}
    >
      <label
        htmlFor={id}
        className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 cursor-pointer"
      >
        <input
          id={id}
          type="checkbox"
          className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-sm border border-border-strong bg-background hover:border-foreground-tertiary checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:shadow-focus"
          {...inputProps}
          aria-labelledby={copyId}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100"
        >
          <AppIcon icon={Check} size={12} strokeWidth={3} decorative />
        </span>
      </label>
      <span id={copyId}>{children}</span>
    </div>
  );
}
