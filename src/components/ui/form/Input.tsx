import type { InputHTMLAttributes } from "react";
import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  saved?: boolean;
}

export const INPUT_BASE_CLASS =
  "h-11 w-full rounded-md border border-border-strong bg-input px-3.5 text-action text-foreground outline-none transition-colors transition-shadow hover:border-foreground-tertiary placeholder:text-foreground-tertiary dark:placeholder:text-foreground-tertiary/60 focus:border-primary focus:bg-input focus:shadow-focus";

export function Input({ className, saved = false, ...rest }: InputProps) {
  return (
    <input
      className={cn(INPUT_BASE_CLASS, saved && SAVED_FIELD_CLASS, className)}
      {...rest}
    />
  );
}
