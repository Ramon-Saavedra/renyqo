import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE_CLASS =
  "inline-flex items-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "h-11 gap-2 rounded-md border border-primary bg-primary px-4.5 text-action font-medium text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "h-11 gap-2 rounded-md border border-primary-soft bg-primary-tint px-4.5 text-action font-medium text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground",
  ghost:
    "gap-1.5 rounded-sm bg-transparent px-2.5 py-1.5 text-caption font-medium text-foreground-secondary hover:bg-background-subtle hover:text-foreground",
};

export function buttonClass(variant: ButtonVariant, extra?: string): string {
  const composed = `${BASE_CLASS} ${VARIANT_CLASS[variant]}`;
  return extra ? `${composed} ${extra}` : composed;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest} />
  );
}
