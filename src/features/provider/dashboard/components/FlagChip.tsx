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
    background: string;
    borderColor: string;
    color: string;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const card = trigger.closest("[data-rq-candidate-card]");
      const cardRect = card?.getBoundingClientRect();
      const styles = getComputedStyle(trigger);
      setPosition({
        left: cardRect ? cardRect.right - 8 : rect.left + rect.width / 2,
        top: rect.bottom + 1,
        width:
          cardRect && cardRect.width > 16
            ? Math.min(cardRect.width - 16, 180)
            : undefined,
        placement: cardRect ? "end" : "center",
        background: styles.getPropertyValue("--rq-tip-bg").trim() || "#08281D",
        borderColor: styles.getPropertyValue("--rq-tip-bd").trim() || "#2A7A5C",
        color: styles.getPropertyValue("--rq-tip-tx").trim() || "#EAF5F0",
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
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 20,
              background: position.background,
              border: `1px solid ${position.borderColor}`,
              color: position.color,
              fontSize: 10.5,
              lineHeight: 1,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              boxSizing: "border-box",
              width: position.width,
              padding: "5px 8px",
              borderRadius: 5,
              boxShadow: "0 6px 18px -6px rgba(0,0,0,.6)",
              opacity: isOpen ? 1 : 0,
              pointerEvents: "none",
              transform:
                position.placement === "end"
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
              transition: "opacity 150ms ease, transform 150ms ease",
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
        style={{
          position: "relative",
          flex: "0 0 auto",
          width: 19,
          height: 19,
          borderRadius: 5,
          background: "var(--rq-warn-ico-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
        }}
      >
        <Icon
          size={12}
          strokeWidth={2}
          aria-hidden="true"
          style={{ color: "var(--rq-warn-ico)" }}
        />
      </span>
      {tooltip}
    </>
  );
}
