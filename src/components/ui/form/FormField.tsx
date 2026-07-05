import { FieldError } from "@/components/ui/form/FieldError";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  labelTrailing?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const REQUIRED_SUFFIX = "— Pflichtfeld";

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  labelTrailing,
  className,
  children,
}: FormFieldProps) {
  const labelClass =
    "flex items-center justify-between gap-2 text-caption font-medium text-foreground";
  const labelInner = (
    <>
      <span className="flex items-center gap-2">
        {label}
        {required && (
          <span className="font-normal text-foreground-tertiary">
            {REQUIRED_SUFFIX}
          </span>
        )}
      </span>
      {labelTrailing}
    </>
  );

  const wrapperClass = `flex min-w-0 flex-col gap-1.75${className ? ` ${className}` : ""}`;

  return (
    <div className={wrapperClass}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {labelInner}
        </label>
      ) : (
        <div className={labelClass}>{labelInner}</div>
      )}
      {children}
      {error && <FieldError message={error} />}
      {hint && (
        <p className="text-caption leading-normal text-foreground-tertiary">
          {hint}
        </p>
      )}
    </div>
  );
}
