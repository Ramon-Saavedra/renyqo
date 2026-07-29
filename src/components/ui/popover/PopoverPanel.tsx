"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

interface PopoverPanelProps {
  ariaLabel: string;
  children: ReactNode;
  trigger: (props: PopoverRenderProps) => ReactNode;
  className?: string;
  panelClassName?: string;
  align?: "left" | "right";
}

interface PopoverRenderProps {
  readonly triggerProps: PopoverTriggerProps;
  readonly triggerRef: (node: HTMLElement | null) => void;
  readonly close: () => void;
}

interface PopoverTriggerProps {
  readonly type: "button";
  readonly "aria-label": string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": boolean;
  readonly "aria-controls": string | undefined;
  readonly onClick: () => void;
}

const PANEL_BASE_CLASS =
  "absolute top-full z-40 rounded-md border border-border bg-background shadow-card";

type CloseReason = "escape" | "programmatic";

export function PopoverPanel({
  ariaLabel,
  children,
  trigger,
  className,
  panelClassName,
  align = "right",
}: PopoverPanelProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const closeReasonRef = useRef<CloseReason | null>(null);

  const triggerRefCallback = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  useEffect(() => {
    if (!open) {
      // Restore focus only for intentional closes (Escape / close callback),
      // never on initial mount or outside click.
      if (closeReasonRef.current) {
        triggerRef.current?.focus();
        closeReasonRef.current = null;
      }
      return;
    }

    const frame = requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    function handlePointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeReasonRef.current = "escape";
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = useCallback(() => {
    closeReasonRef.current = "programmatic";
    setOpen(false);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {trigger({
        triggerProps: {
          type: "button",
          "aria-label": ariaLabel,
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          "aria-controls": open ? panelId : undefined,
          onClick: () => setOpen((current) => !current),
        },
        triggerRef: triggerRefCallback,
        close,
      })}

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={cn(
            PANEL_BASE_CLASS,
            align === "left" ? "left-0" : "right-0",
            "outline-none",
            panelClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
