"use client";

import { useEffect, useState } from "react";

interface RotatingBenefitsProps {
  benefits: readonly string[];
  delay?: number;
}

const ROTATION_INTERVAL = 6000;
const TICK_INTERVAL = 1000;

export function RotatingBenefits({
  benefits,
  delay = 0,
}: RotatingBenefitsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (benefits.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const computeIndex = () =>
      Math.floor((Date.now() + delay) / ROTATION_INTERVAL) % benefits.length;
    setIndex(computeIndex());
    const id = window.setInterval(() => {
      const next = computeIndex();
      setIndex((current) => (current === next ? current : next));
    }, TICK_INTERVAL);
    return () => window.clearInterval(id);
  }, [benefits.length, delay]);

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
