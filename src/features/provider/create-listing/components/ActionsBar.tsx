import { CheckCircle2, CircleDashed } from "lucide-react";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { LoadingButton } from "@/components/ui/loading/LoadingButton";
import { createListingCopy } from "../copy/create-listing";
import type { SubmitStatus } from "../hooks/useCreateListing";

interface ActionsBarProps {
  missing: ReadonlyArray<string>;
  canPublish: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  submitStatus?: SubmitStatus;
  error?: string | null;
}

export type ChecklistVariant = "inline" | "rail";

interface MissingChecklistProps {
  missing: ReadonlyArray<string>;
  canPublish: boolean;
  variant: ChecklistVariant;
}

export const CHECKLIST_ITEMS: ReadonlyArray<{
  label: string;
  targetId: string;
}> = [
  { label: createListingCopy.missingLabels.city, targetId: "city" },
  { label: createListingCopy.missingLabels.zip, targetId: "zip" },
  { label: createListingCopy.missingLabels.street, targetId: "street" },
  { label: createListingCopy.missingLabels.area, targetId: "area" },
  { label: createListingCopy.missingLabels.rooms, targetId: "rooms" },
  { label: createListingCopy.missingLabels.bedrooms, targetId: "bedrooms" },
  { label: createListingCopy.missingLabels.price, targetId: "price" },
  {
    label: createListingCopy.missingLabels.availableFrom,
    targetId: "available-from",
  },
  { label: createListingCopy.missingLabels.legal, targetId: "legal-accepted" },
];

const WRAPPER_CLASS =
  "flex flex-col gap-4 rounded-md border border-border bg-background px-7 py-5.5";
const ROW_CLASS = "flex flex-wrap items-center gap-4";
const BTN_GROUP_CLASS = "flex flex-wrap gap-2.5";

const MISSING_LBL_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const CHECKLIST_CLASS: Record<ChecklistVariant, string> = {
  inline: "min-w-0 xl:hidden",
  rail: "sticky top-21 hidden w-full rounded-md border border-border bg-background-subtle px-3 py-3 xl:block",
};
const CHECKLIST_HEADER_CLASS = "mb-2 flex items-center justify-between gap-3";
const CHECKLIST_COUNT_CLASS =
  "font-mono text-meta tabular-nums text-foreground-tertiary";
const CHECKLIST_LIST_CLASS: Record<ChecklistVariant, string> = {
  inline: "flex flex-wrap gap-1.5",
  rail: "flex flex-col items-start gap-1.5",
};
const MISSING_BUTTON_CLASS =
  "inline-flex items-center gap-2 py-0.5 text-left text-caption text-foreground-secondary transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:cursor-default disabled:text-foreground-tertiary";
const CHECK_ICON_CLASS = "text-success";
const PENDING_ICON_CLASS = "text-foreground-tertiary";
const MISSING_BUTTON_VARIANT_CLASS: Record<ChecklistVariant, string> = {
  inline: MISSING_BUTTON_CLASS,
  rail: `${MISSING_BUTTON_CLASS} max-w-full`,
};

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

export function MissingChecklist({
  missing,
  canPublish,
  variant,
}: MissingChecklistProps) {
  const copy = createListingCopy.abschluss.actions;

  if (canPublish) {
    return (
      <div className={CHECKLIST_CLASS[variant]} aria-live="polite">
        <span className="inline-flex items-start gap-2 rounded-sm border border-success-vivid/40 bg-success-vivid/10 px-2 py-1.5 text-caption text-success-vivid">
          <AppIcon icon={CheckCircle2} size={14} strokeWidth={1.3} decorative />
          {copy.okLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className={CHECKLIST_CLASS[variant]}
      aria-label={copy.missingLabel}
      aria-live="polite"
    >
      <div className={CHECKLIST_HEADER_CLASS}>
        <span className={MISSING_LBL_CLASS}>{copy.missingLabel}</span>
        <span className={CHECKLIST_COUNT_CLASS}>{missing.length}</span>
      </div>
      <div className={CHECKLIST_LIST_CLASS[variant]}>
        {CHECKLIST_ITEMS.map(({ label, targetId }) => {
          const isDone = !missing.includes(label);
          return (
            <button
              key={label}
              type="button"
              className={MISSING_BUTTON_VARIANT_CLASS[variant]}
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

export function ActionsBar({
  missing,
  canPublish,
  onSaveDraft,
  onPublish,
  submitStatus = "idle",
  error,
}: ActionsBarProps) {
  const copy = createListingCopy.abschluss.actions;
  const isBusy = submitStatus !== "idle";
  return (
    <div className={WRAPPER_CLASS}>
      <div className={ROW_CLASS}>
        <MissingChecklist
          missing={missing}
          canPublish={canPublish}
          variant="inline"
        />
        <div className={BTN_GROUP_CLASS}>
          <LoadingButton
            variant="secondary"
            disabled={isBusy}
            loading={submitStatus === "saving"}
            loadingLabel={copy.savingDraft}
            onClick={onSaveDraft}
          >
            {copy.saveDraft}
          </LoadingButton>
          <LoadingButton
            variant="primary"
            disabled={isBusy}
            loading={submitStatus === "publishing"}
            loadingLabel={copy.publishing}
            onClick={onPublish}
          >
            {copy.publish}
          </LoadingButton>
        </div>
      </div>
      {error && <FormAlert variant="error" message={error} />}
    </div>
  );
}
