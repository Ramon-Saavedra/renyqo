import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClass } from "@/components/ui/button/Button";
import { cn } from "@/lib/utils/cn";

interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

const BASE_CLASS = buttonClass("outline", "w-full justify-center gap-2.5");

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
