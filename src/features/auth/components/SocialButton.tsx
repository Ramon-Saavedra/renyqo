import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

const BASE_CLASS =
  "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border border-border-strong bg-background text-action font-medium text-foreground transition-colors hover:border-foreground-tertiary hover:bg-background-subtle focus-visible:outline-none focus-visible:shadow-focus";

export function SocialButton({
  icon,
  children,
  type = "button",
  className,
  ...rest
}: SocialButtonProps) {
  return (
    <button type={type} className={cn(BASE_CLASS, className)} {...rest}>
      <span aria-hidden="true" className="inline-flex shrink-0">
        {icon}
      </span>
      {children}
    </button>
  );
}
