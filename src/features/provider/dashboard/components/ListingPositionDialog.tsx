import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import type { DashboardObject } from "../types";

interface ListingPositionDialogProps {
  object: DashboardObject;
  objects: readonly DashboardObject[];
  pending: boolean;
  trigger: HTMLElement | null;
  onClose: (restoreFocus: boolean) => void;
  onMove: (position: number) => void;
}

const VIEWPORT_MARGIN = 8;

export function ListingPositionDialog({
  object,
  objects,
  pending,
  trigger,
  onClose,
  onMove,
}: ListingPositionDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const currentPosition =
    objects.findIndex((item) => item.id === object.id) + 1;

  const updatePosition = useCallback(() => {
    const dialog = dialogRef.current;
    if (!trigger || !dialog) return;
    const triggerRect = trigger.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const width = dialogRect.width || dialog.offsetWidth;
    const height = dialogRect.height || dialog.offsetHeight;
    let left = triggerRect.left;
    let top = triggerRect.bottom + VIEWPORT_MARGIN;
    const maxLeft = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft);
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    if (top > maxTop) {
      const above = triggerRect.top - height - VIEWPORT_MARGIN;
      top =
        above >= VIEWPORT_MARGIN ? above : Math.max(VIEWPORT_MARGIN, maxTop);
    }
    setPosition({ top, left });
  }, [trigger]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [updatePosition, objects]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (dialogRef.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      onClose(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, trigger]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      id={`listing-position-${object.id}`}
      role="dialog"
      aria-label={`Position von ${object.title} ändern`}
      tabIndex={-1}
      className="fixed z-30 w-max max-w-xs rounded-md border border-border bg-background p-3 shadow-card outline-none"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-meta font-medium uppercase tracking-wide text-foreground-tertiary">
            Position wählen
          </p>
          <p className="mt-1 truncate text-caption text-foreground-secondary">
            {object.title}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onClose(true)}
          aria-label="Schließen"
          className={buttonClassWithSize("ghost", "icon-xs")}
        >
          <AppIcon icon={X} size={15} strokeWidth={1.8} decorative />
        </button>
      </div>

      <div className="scrollbar-slim mt-3 max-w-full overflow-x-auto pb-1">
        <div className="flex w-max items-center gap-1.5">
          {objects.map((item, index) => {
            const itemPosition = index + 1;
            const current = itemPosition === currentPosition;
            return (
              <button
                key={item.id}
                type="button"
                disabled={current || pending}
                aria-current={current ? "true" : undefined}
                aria-label={
                  current
                    ? `Aktuelle Position ${itemPosition}`
                    : `Auf Position ${itemPosition} verschieben`
                }
                onClick={() => {
                  onMove(itemPosition);
                  onClose(true);
                }}
                className={buttonClassWithSize(
                  current ? "secondary" : "ghost",
                  "icon-sm",
                  "shrink-0 tabular-nums",
                )}
              >
                {itemPosition}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
