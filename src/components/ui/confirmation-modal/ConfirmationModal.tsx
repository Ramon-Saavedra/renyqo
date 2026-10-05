"use client";

import { useId, useRef, type RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import { Info, X } from "lucide-react";
import {
  Button,
  buttonClass,
  type ButtonVariant,
} from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { useDialogFocus } from "@/hooks/useDialogFocus";

interface ConfirmationModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly text: string;
  readonly primaryLabel: string;
  readonly primaryAriaLabel?: string | undefined;
  readonly primaryPendingLabel?: string | undefined;
  readonly primaryPending?: boolean;
  readonly primaryDisabled?: boolean;
  readonly primaryVariant?: ButtonVariant;
  readonly secondaryLabel: string;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
  readonly onClose?: (() => void) | undefined;
  readonly closeLabel?: string | undefined;
  readonly tertiaryLabel?: string | undefined;
  readonly tertiaryPendingLabel?: string | undefined;
  readonly onTertiary?: () => void;
  readonly tertiaryPending?: boolean;
  readonly tertiaryDisabled?: boolean;
  readonly error?: string | null;
  readonly icon?: LucideIcon;
  readonly focusFallbackRef?: RefObject<HTMLElement | null> | null;
}

const OVERLAY_CLASS =
  "fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-gutter";
const PANEL_CLASS =
  "relative w-full max-w-md rounded-md border border-border bg-background p-5 shadow-card sm:max-w-xl";
const CLOSE_BUTTON_CLASS = "absolute right-3 top-3";
const ICON_WRAP_CLASS =
  "mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-primary-soft bg-primary-tint text-primary";
const TITLE_CLASS = "mb-2 text-title font-medium text-foreground";
const TEXT_CLASS = "mb-4 text-body text-foreground-secondary";
const ERROR_CLASS =
  "mb-4 rounded-sm border border-border bg-background-muted px-3 py-2 text-caption text-foreground-secondary";
const ACTIONS_CLASS = "grid gap-2";
const ACTION_BUTTON_CLASS =
  "min-h-11 w-full justify-center text-center leading-tight";
export function ConfirmationModal({
  open,
  title,
  text,
  primaryLabel,
  primaryAriaLabel,
  primaryPendingLabel,
  primaryPending = false,
  primaryDisabled = false,
  primaryVariant = "primary",
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose = onPrimary,
  closeLabel = primaryLabel,
  tertiaryLabel,
  tertiaryPendingLabel,
  onTertiary,
  tertiaryPending = false,
  tertiaryDisabled = false,
  error,
  icon: Icon = Info,
  focusFallbackRef,
}: ConfirmationModalProps) {
  const titleId = useId();
  const textId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const actionPending = primaryPending || tertiaryPending;

  useDialogFocus({
    open,
    dialogRef,
    onClose,
    canClose: !actionPending,
    fallbackRef: focusFallbackRef,
  });

  if (!open) return null;

  return (
    <div className={OVERLAY_CLASS} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error ? `${textId} ${errorId}` : textId}
        tabIndex={-1}
        className={PANEL_CLASS}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={CLOSE_BUTTON_CLASS}
          onClick={onClose}
          disabled={actionPending}
          aria-label={closeLabel}
        >
          <AppIcon icon={X} size={16} strokeWidth={1.7} decorative />
        </Button>
        <div className={ICON_WRAP_CLASS}>
          <AppIcon icon={Icon} size={17} strokeWidth={1.5} decorative />
        </div>
        <h2 id={titleId} className={TITLE_CLASS}>
          {title}
        </h2>
        <p id={textId} className={TEXT_CLASS}>
          {text}
        </p>
        {error && (
          <p id={errorId} role="alert" className={ERROR_CLASS}>
            {error}
          </p>
        )}
        <div className={ACTIONS_CLASS}>
          <button
            type="button"
            className={buttonClass(primaryVariant, ACTION_BUTTON_CLASS)}
            aria-label={primaryAriaLabel}
            onClick={onPrimary}
            disabled={actionPending || primaryDisabled}
          >
            {primaryPending && primaryPendingLabel
              ? primaryPendingLabel
              : primaryLabel}
          </button>
          <button
            type="button"
            className={buttonClass("secondary", ACTION_BUTTON_CLASS)}
            onClick={onSecondary}
            disabled={actionPending}
          >
            {secondaryLabel}
          </button>
          {tertiaryLabel && onTertiary && (
            <button
              type="button"
              className={buttonClass("secondary", ACTION_BUTTON_CLASS)}
              onClick={onTertiary}
              disabled={actionPending || tertiaryDisabled}
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
