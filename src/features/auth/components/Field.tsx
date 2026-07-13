import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { FieldError } from "@/components/ui/form/FieldError";
import { Input } from "@/components/ui/form/Input";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  trailing?: ReactNode;
  inputClassName?: string;
}

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
  const input = <Input id={id} className={inputClassName} {...inputProps} />;

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
