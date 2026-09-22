"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar/Avatar";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";
import type { ApplicantPreview } from "../types";

interface ApplicantPreviewModalProps {
  readonly applicant: ApplicantPreview | null;
  readonly onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function ApplicantPreviewModal({
  applicant,
  onClose,
}: ApplicantPreviewModalProps) {
  const open = applicant !== null;
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const copy = dashboardCopy.preview;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        const activeElement = document.activeElement;
        restoreFocusRef.current =
          activeElement instanceof HTMLElement ? activeElement : null;
        wasOpenRef.current = true;
      }
      const dialog = dialogRef.current;
      const firstFocusable = dialog
        ? getFocusableElements(dialog)[0]
        : undefined;
      (firstFocusable ?? dialog)?.focus();
      return;
    }

    if (!wasOpenRef.current) return;
    const elementToRestore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    wasOpenRef.current = false;
    if (elementToRestore?.isConnected) elementToRestore.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === first ||
          activeElement === dialog ||
          !dialog.contains(activeElement)
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (
        activeElement === last ||
        activeElement === dialog ||
        !dialog.contains(activeElement)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (applicant === null || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="bg-foreground/20 fixed inset-0 z-50 flex items-center justify-center px-gutter"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={applicant.introduction ? descriptionId : undefined}
        tabIndex={-1}
        className="bg-background border-border relative max-h-full w-full max-w-md overflow-y-auto rounded-md border p-6 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          onClick={onClose}
          aria-label={copy.close}
        >
          <AppIcon icon={X} size={16} strokeWidth={1.7} decorative />
        </Button>

        <div className="flex items-center gap-4">
          <Avatar
            size="lg"
            initials={applicant.initials}
            label={applicant.name}
          />
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-heading-md font-medium text-foreground"
            >
              {applicant.name}
            </h2>
            <p className="text-caption text-foreground-tertiary mt-1 flex items-center gap-1.5">
              <AppIcon icon={Users} size={13} strokeWidth={1.8} decorative />
              {applicant.household}
            </p>
          </div>
        </div>

        {applicant.introduction ? (
          <p
            id={descriptionId}
            className="text-body text-foreground-secondary mt-4 text-pretty"
          >
            {applicant.introduction}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
