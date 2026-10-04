"use client";

import { useEffect, useRef, type RefObject } from "react";

interface DialogFocusOptions {
  readonly open: boolean;
  readonly dialogRef: RefObject<HTMLElement | null>;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly fallbackRef?: RefObject<HTMLElement | null> | null | undefined;
  readonly onClose: () => void;
  readonly canClose?: boolean;
  readonly lockScroll?: boolean;
}

function isKeyboardAccessible(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(":disabled")) return false;
  for (
    let ancestor: HTMLElement | null = element;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    const style = getComputedStyle(ancestor);
    if (
      ancestor.hidden ||
      ancestor.inert ||
      ancestor.hasAttribute("inert") ||
      style.display === "none" ||
      style.contentVisibility === "hidden"
    )
      return false;
  }
  const visibility = getComputedStyle(element).visibility;
  return visibility !== "hidden" && visibility !== "collapse";
}

function getTabStops(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>("*")).filter(
    isKeyboardAccessible,
  );
}

export function useDialogFocus({
  open,
  dialogRef,
  initialFocusRef,
  fallbackRef,
  onClose,
  canClose = true,
  lockScroll = false,
}: DialogFocusOptions): void {
  const behaviorRef = useRef({ onClose, canClose, fallbackRef });
  useEffect(() => {
    behaviorRef.current = { onClose, canClose, fallbackRef };
  }, [onClose, canClose, fallbackRef]);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const trigger =
      active instanceof HTMLElement &&
      active !== document.body &&
      active !== document.documentElement
        ? active
        : null;
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    (
      initialFocusRef?.current ??
      (dialog ? getTabStops(dialog)[0] : null) ??
      dialog
    )?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const currentDialog = dialogRef.current;
        const nestedDialog = currentDialog?.querySelector("[role='dialog']");
        const activeElement = document.activeElement;
        if (
          nestedDialog instanceof HTMLElement &&
          activeElement instanceof Node &&
          nestedDialog.contains(activeElement)
        ) {
          return;
        }
        if (behaviorRef.current.canClose) {
          event.preventDefault();
          behaviorRef.current.onClose();
        }
        return;
      }
      const currentDialog = dialogRef.current;
      if (event.key !== "Tab" || !currentDialog) return;
      const stops = getTabStops(currentDialog);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) {
        event.preventDefault();
        currentDialog.focus();
        return;
      }
      const activeElement = document.activeElement;
      const outsideOrder = !stops.some((element) => element === activeElement);
      if (
        outsideOrder ||
        (event.shiftKey ? activeElement === first : activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      const target = trigger?.isConnected
        ? trigger
        : behaviorRef.current.fallbackRef?.current;
      if (target?.isConnected) target.focus();
    };
  }, [open, dialogRef, initialFocusRef, lockScroll]);
}
