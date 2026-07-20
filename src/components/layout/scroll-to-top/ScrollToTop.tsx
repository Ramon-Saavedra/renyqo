"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

const SCROLL_THRESHOLD = 360;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  function handleClick() {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";

    window.scrollTo({ top: 0, behavior });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Nach oben"
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-40 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-card transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus sm:bottom-6 sm:right-6"
    >
      <AppIcon icon={ArrowUp} size={18} strokeWidth={1.8} decorative />
    </button>
  );
}
