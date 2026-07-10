import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type RenyqoSkeletonVariant = "box" | "circle" | "pill";

export interface RenyqoSkeletonProps {
  variant?: RenyqoSkeletonVariant;
  /** Placeholder size (dynamic layout value, not a design token). */
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

const VARIANT_CLASS: Record<RenyqoSkeletonVariant, string> = {
  box: "sk",
  circle: "sk-circle",
  pill: "sk-pill",
};

function toSize(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * A single skeleton block used inside a veil. Colours and radii come from the
 * design tokens (`--background-muted`, `--radius-sm`); only the layout size is
 * passed inline, since that is per-placeholder and not a token.
 */
export function RenyqoSkeleton({
  variant = "box",
  width,
  height,
  className,
  style,
}: RenyqoSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("block", VARIANT_CLASS[variant], className)}
      style={{ width: toSize(width), height: toSize(height), ...style }}
    />
  );
}
