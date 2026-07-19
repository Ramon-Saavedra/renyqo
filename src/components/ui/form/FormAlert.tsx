import { cn } from "@/lib/utils/cn";

type FormAlertVariant = "error" | "success";

interface FormAlertProps {
  variant: FormAlertVariant;
  message: string;
  className?: string;
  id?: string;
}

const VARIANT_CLASSES: Record<FormAlertVariant, string> = {
  error: "border-warning/20 bg-warning/10 text-warning",
  success: "border-success/20 bg-success/10 text-success",
};

export function FormAlert({ variant, message, className, id }: FormAlertProps) {
  return (
    <div
      id={id}
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-caption",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {message}
    </div>
  );
}
