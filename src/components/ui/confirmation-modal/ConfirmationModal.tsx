"use client";

import { useEffect, useId } from "react";
import type { LucideIcon } from "lucide-react";
import { Info, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface ConfirmationModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly text: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
  readonly tertiaryLabel?: string | undefined;
  readonly tertiaryPendingLabel?: string | undefined;
  readonly onTertiary?: () => void;
  readonly tertiaryPending?: boolean;
  readonly tertiaryDisabled?: boolean;
  readonly error?: string | null;
  readonly icon?: LucideIcon;
}

const OVERLAY_CLASS =
  "fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-gutter";
const PANEL_CLASS =
  "relative w-full max-w-md rounded-md border border-border bg-background p-5 shadow-card sm:max-w-xl";
const CLOSE_BUTTON_CLASS =
  "absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
const ICON_WRAP_CLASS =
  "mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-primary-soft bg-primary-tint text-primary";
const TITLE_CLASS = "mb-2 text-title font-medium text-foreground";
const TEXT_CLASS = "mb-4 text-body text-foreground-secondary";
const ERROR_CLASS =
  "mb-4 rounded-sm border border-border bg-background-subtle px-3 py-2 text-caption text-foreground-secondary";
const ACTIONS_CLASS = "grid gap-2";
const ACTION_BUTTON_CLASS =
  "min-h-11 w-full justify-center text-center leading-tight";

export function ConfirmationModal({
  open,
  title,
  text,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  tertiaryLabel,
  tertiaryPendingLabel,
  onTertiary,
  tertiaryPending = false,
  tertiaryDisabled = false,
  error,
  icon: Icon = Info,
}: ConfirmationModalProps) {
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPrimary();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrimary, open]);

  if (!open) return null;

  return (
    <div className={OVERLAY_CLASS} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className={PANEL_CLASS}
      >
        <button
          type="button"
          className={CLOSE_BUTTON_CLASS}
          onClick={onPrimary}
          disabled={tertiaryPending}
          aria-label={primaryLabel}
        >
          <AppIcon icon={X} size={16} strokeWidth={1.7} decorative />
        </button>
        <div className={ICON_WRAP_CLASS}>
          <AppIcon icon={Icon} size={17} strokeWidth={1.5} decorative />
        </div>
        <h2 id={titleId} className={TITLE_CLASS}>
          {title}
        </h2>
        <p id={textId} className={TEXT_CLASS}>
          {text}
        </p>
        {error && <p className={ERROR_CLASS}>{error}</p>}
        <div className={ACTIONS_CLASS}>
          <button
            type="button"
            className={buttonClass("primary", ACTION_BUTTON_CLASS)}
            onClick={onPrimary}
            disabled={tertiaryPending}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className={cn(
              buttonClass("ghost"),
              ACTION_BUTTON_CLASS,
              "border border-primary-soft bg-primary-tint text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground",
            )}
            onClick={onSecondary}
            disabled={tertiaryPending}
          >
            {secondaryLabel}
          </button>
          {tertiaryLabel && onTertiary && (
            <button
              type="button"
              className={buttonClass("secondary", ACTION_BUTTON_CLASS)}
              onClick={onTertiary}
              disabled={tertiaryPending || tertiaryDisabled}
            >
              {tertiaryPending && tertiaryPendingLabel
                ? tertiaryPendingLabel
                : tertiaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
