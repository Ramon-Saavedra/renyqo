import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const INPUT_BASE_CLASS =
  "h-11 w-full rounded-md border border-border-strong bg-input px-3.5 text-action text-foreground outline-none transition-colors transition-shadow hover:border-foreground-tertiary placeholder:text-foreground-tertiary dark:placeholder:text-foreground-tertiary/60 focus:border-primary focus:bg-input focus:shadow-focus";

export function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={
        className ? `${INPUT_BASE_CLASS} ${className}` : INPUT_BASE_CLASS
      }
      {...rest}
    />
  );
}
