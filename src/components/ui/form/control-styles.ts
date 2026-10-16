// Stable action focus is intentionally independent of dashboard accent colors.
export const FIELD_STATE_CLASS =
  "enabled:hover:not-focus:border-foreground-tertiary focus:border-primary-default focus:bg-input focus:shadow-focus disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-background-muted disabled:text-foreground-tertiary";

// Inset feedback stays visible inside clipped stepper shells.
const COMPOUND_FOCUS_BASE_CLASS =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:[box-shadow:inset_var(--focus-ring)]";

export const COMPOUND_BUTTON_FOCUS_CLASS = `${COMPOUND_FOCUS_BASE_CLASS} focus-visible:outline-primary-default`;
export const COMPOUND_SELECTED_FOCUS_CLASS = `${COMPOUND_FOCUS_BASE_CLASS} focus-visible:outline-primary-foreground`;
