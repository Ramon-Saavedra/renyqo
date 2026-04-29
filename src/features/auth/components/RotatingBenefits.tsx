"use client";

import { useCallback, useSyncExternalStore } from "react";

interface RotatingBenefitsProps {
  benefits: readonly string[];
  delay?: number;
}

const ROTATION_INTERVAL = 6000;
const TICK_INTERVAL = 1000;

const getServerSnapshot = () => 0;

export function RotatingBenefits({
  benefits,
  delay = 0,
}: RotatingBenefitsProps) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (benefits.length <= 1) return () => {};
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return () => {};
      }
      const id = window.setInterval(onStoreChange, TICK_INTERVAL);
      return () => window.clearInterval(id);
    },
    [benefits.length],
  );

  const getSnapshot = useCallback(
    () =>
      Math.floor((Date.now() + delay) / ROTATION_INTERVAL) % benefits.length,
    [benefits.length, delay],
  );

  const index = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="border-t border-border pt-5">
      <div className="relative min-h-12">
        {benefits.map((benefit, i) => (
          <p
            key={benefit}
            aria-hidden={i !== index}
            className={`absolute inset-x-0 top-0 text-caption leading-5 text-foreground-tertiary transition-all duration-700 ease-out motion-reduce:transition-none ${
              i === index
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            {benefit}
          </p>
        ))}
      </div>
    </div>
  );
}
