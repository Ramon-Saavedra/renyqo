import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerGhost";

export type ButtonSize =
  | "md"
  | "sm"
  | "icon-2xs"
  | "icon-xs"
  | "icon-sm"
  | "icon-md";

const BASE_CLASS =
  "inline-flex items-center cursor-pointer focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "h-11 gap-2 rounded-md px-4.5 text-action font-medium",
  sm: "h-8 gap-1.5 rounded-sm px-3 text-caption font-medium",
  "icon-2xs": "h-6 w-6 justify-center rounded-sm p-0",
  "icon-xs": "h-7 w-7 justify-center rounded-sm p-0",
  "icon-sm": "h-8 w-8 justify-center rounded-sm p-0",
  "icon-md": "h-11 w-11 justify-center rounded-md p-0",
};

const DEFAULT_SIZE: Record<ButtonVariant, ButtonSize> = {
  primary: "md",
  outline: "md",
  ghost: "sm",
  danger: "md",
  dangerGhost: "sm",
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "border border-button-primary bg-button-primary text-primary-foreground hover:border-button-primary-hover hover:bg-button-primary-hover",
  outline:
    "border border-border-strong bg-transparent text-foreground-secondary hover:border-foreground-tertiary hover:bg-background-muted hover:text-foreground",
  ghost:
    "bg-transparent text-foreground-secondary hover:bg-background-muted hover:text-foreground",
  danger:
    "border border-danger/20 bg-background text-danger hover:bg-danger/10",
  dangerGhost: "bg-transparent text-danger hover:bg-danger/10",
};

/** Color classes for a variant, without size. Use when the control cannot take the standard size. */
export function buttonVariantClass(variant: ButtonVariant): string {
  return VARIANT_CLASS[variant];
}

/** Shared button frame without a color variant. */
export function buttonFrameClass(size: ButtonSize = "md"): string {
  return [BASE_CLASS, SIZE_CLASS[size]].join(" ");
}

/**
 * Composes a button class string from a variant and optional extra classes.
 * Use `buttonClassWithSize` when an explicit size is required.
 */
export function buttonClass(variant: ButtonVariant, extra?: string): string {
  return [
    BASE_CLASS,
    VARIANT_CLASS[variant],
    SIZE_CLASS[DEFAULT_SIZE[variant]],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buttonClassWithSize(
  variant: ButtonVariant,
  size: ButtonSize,
  extra?: string,
): string {
  const classes = [BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size]];
  if (extra) classes.push(extra);
  return classes.join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClassWithSize(variant, size), className)}
      {...rest}
    />
  );
}
