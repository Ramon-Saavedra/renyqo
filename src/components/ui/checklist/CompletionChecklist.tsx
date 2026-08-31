"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

export type ChecklistVariant = "inline" | "rail" | "panel";

export interface ChecklistItem {
  label: string;
  targetId: string;
}

interface CompletionChecklistProps {
  items: ReadonlyArray<ChecklistItem>;
  missing: ReadonlyArray<string>;
  complete: boolean;
  variant: ChecklistVariant;
  missingLabel: string;
  okLabel: string;
  hint?: string;
  className?: string;
}

const VARIANT_CLASS: Record<ChecklistVariant, string> = {
  inline: "min-w-0 xl:hidden",
  rail: "sticky top-21 hidden w-full rounded-md border border-border bg-background-muted px-3 py-3 xl:block",
  panel: "w-full rounded-md border border-border bg-background-muted px-3 py-3",
};
const HEADER_CLASS = "mb-2 flex items-center justify-between gap-3";
const LABEL_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";
const COUNT_CLASS = "font-mono text-meta tabular-nums text-foreground-tertiary";
const LIST_CLASS: Record<ChecklistVariant, string> = {
  inline: "flex flex-wrap gap-1.5",
  rail: "flex flex-col items-start gap-1.5",
  panel: "flex flex-col items-start gap-1.5",
};
const ITEM_CLASS =
  "inline-flex items-center gap-2 py-0.5 text-left text-caption text-foreground-secondary hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:cursor-default disabled:text-foreground-tertiary";
const ITEM_VARIANT_CLASS: Record<ChecklistVariant, string> = {
  inline: ITEM_CLASS,
  rail: `${ITEM_CLASS} max-w-full`,
  panel: `${ITEM_CLASS} max-w-full`,
};
const OK_CLASS =
  "inline-flex items-start gap-2 rounded-sm border border-success-vivid/40 bg-success-vivid/10 px-2 py-1.5 text-caption text-success-vivid";
const CHECK_ICON_CLASS = "text-success";
const PENDING_ICON_CLASS = "text-foreground-tertiary";

function focusInteractiveTarget(target: HTMLElement) {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement
  ) {
    target.focus({ preventScroll: true });
    return;
  }

  const focusable = target.querySelector<HTMLElement>(
    'input, select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  focusable?.focus({ preventScroll: true });
}

export function scrollToMissingField(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  focusInteractiveTarget(target);
}

export function CompletionChecklist({
  items,
  missing,
  complete,
  variant,
  missingLabel,
  okLabel,
  hint,
  className,
}: CompletionChecklistProps) {
  if (complete) {
    return (
      <div className={cn(VARIANT_CLASS[variant], className)} aria-live="polite">
        <span className={OK_CLASS}>
          <AppIcon icon={CheckCircle2} size={14} strokeWidth={1.3} decorative />
          {okLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(VARIANT_CLASS[variant], className)}
      aria-label={missingLabel}
      aria-live="polite"
    >
      <div className={HEADER_CLASS}>
        <span className={LABEL_CLASS}>{missingLabel}</span>
        <span className={COUNT_CLASS}>{missing.length}</span>
      </div>
      {hint ? (
        <p className="mb-2 text-caption leading-normal text-foreground-secondary">
          {hint}
        </p>
      ) : null}
      <div className={LIST_CLASS[variant]}>
        {items.map(({ label, targetId }) => {
          const isDone = !missing.includes(label);
          return (
            <button
              key={label}
              type="button"
              className={ITEM_VARIANT_CLASS[variant]}
              onClick={() => scrollToMissingField(targetId)}
            >
              <AppIcon
                icon={isDone ? CheckCircle2 : CircleDashed}
                size={13}
                strokeWidth={1.5}
                decorative
                className={isDone ? CHECK_ICON_CLASS : PENDING_ICON_CLASS}
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
