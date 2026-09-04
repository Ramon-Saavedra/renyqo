import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "primaryGhost"
  | "inverseGhost";

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

/**
 * Default size applied when `buttonClass` is called without an explicit size.
 * Ghost defaults to sm to preserve the original compact appearance used in
 * toolbars, auth-page links and inline actions.
 */
const DEFAULT_SIZE: Record<ButtonVariant, ButtonSize> = {
  primary: "md",
  secondary: "md",
  outline: "md",
  ghost: "sm",
  danger: "md",
  dangerGhost: "sm",
  primaryGhost: "sm",
  inverseGhost: "sm",
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "border border-primary-soft bg-primary-tint text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground",
  outline:
    "border border-border-strong bg-transparent text-foreground-secondary hover:border-foreground-tertiary hover:bg-background-muted hover:text-foreground",
  ghost:
    "bg-transparent text-foreground-secondary hover:bg-background-muted hover:text-foreground",
  danger:
    "border border-danger/20 bg-background text-danger hover:bg-danger/10",
  dangerGhost: "bg-transparent text-danger hover:bg-danger/10",
  primaryGhost:
    "bg-transparent text-primary hover:bg-primary-tint hover:text-primary-hover",
  inverseGhost:
    "bg-transparent text-primary-foreground hover:bg-primary-foreground/20",
};

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

/**
 * Composes a button class string with an explicit size. Prefer this over
 * `buttonClass` when the size is known at compile time.
 */
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
