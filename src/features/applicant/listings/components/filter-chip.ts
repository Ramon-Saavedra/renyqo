import { cn } from "@/lib/utils/cn";

const CHIP_BASE_CLASS =
  "inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-caption whitespace-nowrap focus-visible:outline-none focus-visible:shadow-focus";

const CHIP_IDLE_CLASS =
  "border-border-strong bg-input text-foreground hover:border-foreground-tertiary hover:bg-background-subtle";

const CHIP_ACTIVE_CLASS =
  "border-primary bg-primary-tint text-primary hover:bg-primary-soft";

const CHIP_TOGGLE_ON_CLASS =
  "border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover";

/**
 * Returns the CSS class for a filter chip.
 *
 * @param active  Whether the chip is currently selected.
 * @param extra   Additional Tailwind classes to append.
 * @param variant "filter" for a tinted active state, "toggle" for a solid filled active state.
 */
export function filterChipClass(
  active: boolean,
  extra?: string,
  variant: "filter" | "toggle" = "filter",
): string {
  const activeClass =
    variant === "toggle" ? CHIP_TOGGLE_ON_CLASS : CHIP_ACTIVE_CLASS;
  return cn(CHIP_BASE_CLASS, active ? activeClass : CHIP_IDLE_CLASS, extra);
}
