import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface RenyqoRevealProps {
  /** While true, the skeleton veil is shown instead of the real content. */
  loading: boolean;
  /** Skeleton layout shown inside the veil. */
  skeleton: ReactNode;
  /** Real content, revealed once loading resolves. Optional for first-load. */
  children?: ReactNode;
  /** Use the top-to-bottom light sweep instead of left-to-right. */
  vertical?: boolean;
  /**
   * Cascade offset in seconds. Set incrementally across a list of reveals to
   * get the "leise Welle" instead of everything blinking at once.
   */
  stagger?: number;
  /**
   * Overlay mode (the design's exact behaviour): the real content is always
   * mounted beneath an absolutely-positioned veil that lifts away on reveal.
   * Requires content that already has a size — use for re-validating a card
   * that already holds data. Defaults to standalone (self-sizing) mode, which
   * suits first-load states where no data exists yet.
   */
  overlay?: boolean;
  className?: string;
}

/**
 * Skeleton veil from the Renyqo loading system: a calm surface, a single light
 * sweep and a soft ring pulse — no spinner. Timings/animations are defined once
 * in globals.css; the cascade is driven by the `--rq-stagger` custom property,
 * so nothing is hardcoded per page.
 */
export function RenyqoReveal({
  loading,
  skeleton,
  children,
  vertical = false,
  stagger,
  overlay = false,
  className,
}: RenyqoRevealProps) {
  const style =
    stagger !== undefined
      ? ({ "--rq-stagger": `${stagger}s` } as CSSProperties)
      : undefined;

  if (overlay) {
    return (
      <div
        className={cn("reveal-wrap", !loading && "is-loaded", className)}
        style={style}
        aria-busy={loading}
      >
        <div className="real">{children}</div>
        <div className={cn("veil", vertical && "veil-v")} aria-hidden="true">
          {skeleton}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("reveal-wrap", !loading && "is-loaded", className)}
      style={style}
      aria-busy={loading}
    >
      {loading ? (
        <div
          className={cn("veil veil-static", vertical && "veil-v")}
          aria-hidden="true"
        >
          {skeleton}
        </div>
      ) : (
        <div className="real rq-fade-in">{children}</div>
      )}
    </div>
  );
}
