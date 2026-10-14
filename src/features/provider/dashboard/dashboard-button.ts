import { buttonFrameClass } from "@/components/ui/button/Button";

/** Accent-scoped primary for dashboard action buttons. Global buttons stay on `--button-primary`. */
export const DASHBOARD_PRIMARY_COLOR_CLASS =
  "border border-dashboard-button-primary bg-dashboard-button-primary text-primary-foreground hover:border-dashboard-button-primary-hover hover:bg-dashboard-button-primary-hover";

export function dashboardPrimaryClass(extra?: string): string {
  return [buttonFrameClass("md"), DASHBOARD_PRIMARY_COLOR_CLASS, extra]
    .filter(Boolean)
    .join(" ");
}
