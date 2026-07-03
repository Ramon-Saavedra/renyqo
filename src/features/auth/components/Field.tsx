import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { FieldError } from "@/components/ui/form/FieldError";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  trailing?: ReactNode;
  inputClassName?: string;
}

const INPUT_CLASS =
  "h-11 w-full rounded-md border border-border-strong bg-background px-3.5 text-action text-foreground placeholder:text-foreground-tertiary transition-colors hover:border-foreground-tertiary focus:border-primary focus:outline-none focus:shadow-focus";

export function Field({
  id,
  label,
  hint,
  error,
  trailing,
  inputClassName,
  className,
  ...inputProps
}: FieldProps) {
  const input = (
    <input
      id={id}
      className={cn(INPUT_CLASS, inputClassName)}
      {...inputProps}
    />
  );

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-caption font-medium text-foreground-secondary"
      >
        {label}
      </label>
      {trailing ? (
        <div className="relative">
          {input}
          {trailing}
        </div>
      ) : (
        input
      )}
      {error && <FieldError message={error} />}
      {!error && hint && (
        <span className="text-caption text-foreground-tertiary">{hint}</span>
      )}
    </div>
  );
}
