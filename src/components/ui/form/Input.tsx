import { FIELD_STATE_CLASS } from "./control-styles";
import type { InputHTMLAttributes } from "react";
import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  saved?: boolean;
  density?: "default" | "compact";
}

const INPUT_SURFACE_CLASS =
  "w-full rounded-md border border-border-strong bg-input text-foreground outline-none placeholder:text-foreground-tertiary dark:placeholder:text-foreground-tertiary/60";
const INPUT_SIZE_CLASS = "h-11 px-3.5 text-action";

export const INPUT_BASE_CLASS = cn(
  INPUT_SURFACE_CLASS,
  INPUT_SIZE_CLASS,
  FIELD_STATE_CLASS,
);

export function Input({
  className,
  saved = false,
  density = "default",
  ...rest
}: InputProps) {
  return (
    <input
      className={cn(
        INPUT_SURFACE_CLASS,
        density === "compact" ? "h-8.5 px-2.5 text-caption" : INPUT_SIZE_CLASS,
        FIELD_STATE_CLASS,
        saved && SAVED_FIELD_CLASS,
        className,
      )}
      {...rest}
    />
  );
}
