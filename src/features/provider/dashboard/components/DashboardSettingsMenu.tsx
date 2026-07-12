"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle/ThemeToggle";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { logout } from "@/lib/api/auth";
import type { AccentId } from "../copy/dashboard";
import { dashboardCopy } from "../copy/dashboard";
import { AccentPicker } from "./AccentPicker";

interface DashboardSettingsMenuProps {
  accent: AccentId;
  onAccentChange: (accent: AccentId) => void;
  userEmail: string | null;
  trigger: React.ReactNode;
  triggerClassName: string;
}

const WRAP_CLASS = "relative";
const PANEL_CLASS =
  "absolute right-0 top-full z-30 w-72 rounded-md border border-border bg-background p-3 shadow-card";
const PANEL_HEAD_CLASS = "mb-3 flex items-center justify-between gap-3";
const PANEL_TITLE_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const THEME_ROW_CLASS =
  "flex items-center justify-between gap-3 rounded-md border border-border bg-background-subtle p-3";
const THEME_LABEL_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const THEME_TOGGLE_CLASS =
  "inline-flex items-center gap-2 rounded-sm border border-border-strong bg-background px-3 py-2 text-caption font-medium text-foreground-secondary transition-colors hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";
const EMAIL_CLASS =
  "mt-3 truncate border-t border-border pt-3 text-caption text-foreground-tertiary";
const LOGOUT_BUTTON_CLASS =
  "mt-3 inline-flex w-full cursor-pointer items-center gap-2 rounded-sm border border-danger/20 bg-background px-3 py-2 text-left text-caption font-medium text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60";

export function DashboardSettingsMenu({
  accent,
  onAccentChange,
  userEmail,
  trigger,
  triggerClassName,
}: DashboardSettingsMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const { profile } = dashboardCopy;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div ref={wrapRef} className={WRAP_CLASS}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={profile.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={profile.settings}
          className={PANEL_CLASS}
        >
          <div className={PANEL_HEAD_CLASS}>
            <span className={PANEL_TITLE_CLASS}>{profile.settings}</span>
          </div>

          <div className="mb-3">
            <AccentPicker
              value={accent}
              onChange={onAccentChange}
              variant="panel"
            />
          </div>

          <div className={THEME_ROW_CLASS}>
            <span className={THEME_LABEL_CLASS}>Darstellung</span>
            <ThemeToggle
              showLabel
              iconSize={14}
              className={THEME_TOGGLE_CLASS}
            />
          </div>

          <button
            type="button"
            className={LOGOUT_BUTTON_CLASS}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <AppIcon icon={LogOut} size={14} decorative />
            <span>{loggingOut ? "Wird abgemeldet …" : "Abmelden"}</span>
          </button>

          {userEmail && <p className={EMAIL_CLASS}>{userEmail}</p>}
        </div>
      )}
    </div>
  );
}
