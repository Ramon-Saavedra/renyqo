import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const BASE_CLASS =
  "min-h-24 w-full resize-y rounded-md border border-border-strong bg-background-subtle px-3.5 py-3 text-action leading-normal text-foreground outline-none transition-colors transition-shadow hover:border-foreground-tertiary placeholder:text-foreground-tertiary focus:border-primary focus:bg-background focus:shadow-focus";

export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}
      {...rest}
    />
  );
}
