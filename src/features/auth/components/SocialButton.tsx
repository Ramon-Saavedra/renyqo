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

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.16v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.16a11 11 0 0 0 0 9.92l3.69-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.5c1.61 0 3.06.55 4.21 1.64l3.15-3.15C17.45 2.18 14.97 1 12 1A11 11 0 0 0 2.16 7.04l3.69 2.84C6.71 7.43 9.14 5.5 12 5.5z"
      />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 12.04c-.03-2.7 2.21-4 2.31-4.06-1.26-1.84-3.22-2.09-3.92-2.12-1.67-.17-3.26.98-4.11.98-.85 0-2.16-.96-3.55-.93-1.83.03-3.51 1.06-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.83.91 1.31 1.99 2.78 3.41 2.72 1.37-.06 1.89-.88 3.54-.88 1.65 0 2.12.88 3.56.85 1.47-.03 2.4-1.33 3.3-2.65 1.04-1.52 1.47-2.99 1.49-3.07-.03-.01-2.86-1.1-2.94-4.37zM14.34 4.13c.75-.91 1.26-2.18 1.12-3.43-1.08.04-2.39.72-3.17 1.62-.7.8-1.31 2.08-1.15 3.32 1.21.09 2.45-.61 3.2-1.51z" />
    </svg>
  );
}
