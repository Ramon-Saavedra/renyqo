"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { AppIcon } from "../icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { safeSetItem } from "@/lib/utils/storage";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  safeSetItem(STORAGE_KEY, theme);
}

interface ThemeToggleProps {
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className,
  iconSize = 16,
  showLabel = false,
}: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Hellmodus" : "Dunkelmodus";

  const toggle = () => {
    applyTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn("cursor-pointer rounded-full", className)}
    >
      <AppIcon
        icon={isDark ? Moon : Sun}
        decorative
        size={iconSize}
        className="text-foreground"
      />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
