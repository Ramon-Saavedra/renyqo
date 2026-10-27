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
  className?: string | undefined;
  panelClassName?: string | undefined;
  align?: "left" | "right";
  onClose?: () => void;
  closeOnLinkClick?: boolean;
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
  "absolute top-full z-40 rounded-md border border-border dark:border-border-strong bg-background shadow-card";
const PANEL_VIEWPORT_MARGIN = 16;

function keepPanelInViewport(panel: HTMLElement): void {
  panel.style.transform = "";
  const rect = panel.getBoundingClientRect();
  let shift = 0;
  if (rect.left < PANEL_VIEWPORT_MARGIN) {
    shift = PANEL_VIEWPORT_MARGIN - rect.left;
  }
  const overflowRight =
    rect.right + shift - (window.innerWidth - PANEL_VIEWPORT_MARGIN);
  if (overflowRight > 0) shift -= overflowRight;
  panel.style.transform = shift === 0 ? "" : `translateX(${shift}px)`;
}

type CloseReason = "escape" | "programmatic";

export function PopoverPanel({
  ariaLabel,
  children,
  trigger,
  className,
  panelClassName,
  align = "right",
  onClose,
  closeOnLinkClick = false,
}: PopoverPanelProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const closeReasonRef = useRef<CloseReason | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  const triggerRefCallback = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        onCloseRef.current?.();
      }
      wasOpenRef.current = false;
      if (closeReasonRef.current) {
        triggerRef.current?.focus();
        closeReasonRef.current = null;
      }
      return;
    }

    wasOpenRef.current = true;

    const frame = requestAnimationFrame(() => {
      if (panelRef.current) keepPanelInViewport(panelRef.current);
      panelRef.current?.focus();
    });

    function handleResize() {
      if (panelRef.current) keepPanelInViewport(panelRef.current);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeReasonRef.current = "escape";
        setOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
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
          onClickCapture={(event) => {
            if (
              closeOnLinkClick &&
              event.target instanceof Element &&
              event.target.closest("a[href]")
            ) {
              close();
            }
          }}
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
