import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  trailing?: ReactNode;
  inputClassName?: string;
}

const INPUT_CLASS =
  "h-11 w-full rounded-md border border-border-strong bg-background px-3.5 text-action text-foreground placeholder:text-foreground-tertiary transition-colors hover:border-foreground-tertiary focus:border-primary focus:outline-none focus:shadow-focus";

export function Field({
  id,
  label,
  hint,
  trailing,
  inputClassName,
  className,
  ...inputProps
}: FieldProps) {
  return (
    <div className={`grid gap-1.5${className ? ` ${className}` : ""}`}>
      <label
        htmlFor={id}
        className="text-caption font-medium text-foreground-secondary"
      >
        {label}
      </label>
      {trailing ? (
        <div className="relative">
          <input
            id={id}
            className={`${INPUT_CLASS}${inputClassName ? ` ${inputClassName}` : ""}`}
            {...inputProps}
          />
          {trailing}
        </div>
      ) : (
        <input
          id={id}
          className={`${INPUT_CLASS}${inputClassName ? ` ${inputClassName}` : ""}`}
          {...inputProps}
        />
      )}
      {hint && (
        <span className="text-caption text-foreground-tertiary">{hint}</span>
      )}
    </div>
  );
}
