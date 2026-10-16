import { FIELD_STATE_CLASS } from "./control-styles";
import type { TextareaHTMLAttributes } from "react";
import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  saved?: boolean;
}

const BASE_CLASS =
  "min-h-24 w-full resize-y rounded-md border border-border-strong bg-input px-3.5 py-3 text-action leading-normal text-foreground outline-none placeholder:text-foreground-tertiary dark:placeholder:text-foreground-tertiary/60";

export function Textarea({ className, saved = false, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        BASE_CLASS,
        FIELD_STATE_CLASS,
        saved && SAVED_FIELD_CLASS,
        className,
      )}
      {...rest}
    />
  );
}
