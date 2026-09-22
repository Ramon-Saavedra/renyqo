import { Cigarette, PawPrint } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CandidateWarning } from "../types";

export function FlagChip({ warning }: { warning: CandidateWarning }) {
  const label =
    warning === "smoking_by_arrangement"
      ? "Rauchen klären"
      : "Haustiere klären";
  const Icon = warning === "smoking_by_arrangement" ? Cigarette : PawPrint;
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number | undefined;
    placement: "center" | "end";
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const card = trigger.closest("[data-rq-candidate-card]");
      const cardRect = card?.getBoundingClientRect();
      setPosition({
        left: cardRect ? cardRect.right - 8 : rect.left + rect.width / 2,
        top: rect.bottom + 1,
        width:
          cardRect && cardRect.width > 16
            ? Math.min(cardRect.width - 16, 180)
            : undefined,
        placement: cardRect ? "end" : "center",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const tooltip =
    typeof document !== "undefined" && isOpen && position
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="border-border-strong bg-background text-foreground fixed z-20 border text-[10.5px] leading-none font-normal whitespace-normal shadow-card"
            style={{
              top: position.top,
              left: position.left,
              boxSizing: "border-box",
              width: position.width,
              overflowWrap: "anywhere",
              padding: "5px 8px",
              borderRadius: 5,
              pointerEvents: "none",
              transform:
                position.placement === "end"
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
            }}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        data-rq-tip=""
        tabIndex={0}
        aria-label={label}
        aria-describedby={isOpen && position ? tooltipId : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        className="text-warning relative flex shrink-0 items-center justify-center"
        style={{ width: 44, height: 44, borderRadius: 4, cursor: "default" }}
      >
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
      {tooltip}
    </>
  );
}
