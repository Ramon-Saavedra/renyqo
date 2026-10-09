export type Tone = "primary" | "neutral" | "success" | "warning";

export const TONE_BADGE_CLASS: Record<Tone, string> = {
  primary: "border-primary-soft bg-primary-tint text-primary",
  neutral: "border-border bg-background-subtle text-foreground-secondary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export const TONE_DOT_CLASS: Record<Tone, string> = {
  primary: "bg-primary-tint text-primary",
  neutral: "bg-background-subtle text-foreground-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};
