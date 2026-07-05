import { CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { createListingCopy } from "../copy/create-listing";

interface ActionsBarProps {
  missing: ReadonlyArray<string>;
  canPublish: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const WRAPPER_CLASS =
  "mt-4.5 flex flex-col gap-4 rounded-md border border-border bg-background px-7 py-5.5";
const ROW_CLASS = "flex flex-wrap items-center justify-between gap-4";
const BTN_GROUP_CLASS = "flex flex-wrap gap-2.5";
const PUBLISH_BTN_CLASS =
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-background-muted disabled:text-foreground-tertiary";

const MISSING_LBL_CLASS =
  "mr-1.5 font-mono text-meta uppercase text-foreground-tertiary";
const MISSING_CHIP_CLASS =
  "rounded-sm border border-border bg-background-subtle px-2 py-0.75 text-caption text-foreground";

export function ActionsBar({
  missing,
  canPublish,
  onSaveDraft,
  onPublish,
  isLoading = false,
  error,
}: ActionsBarProps) {
  const copy = createListingCopy.abschluss.actions;
  return (
    <div className={WRAPPER_CLASS}>
      <div className={ROW_CLASS}>
        <div className="min-w-0">
          {canPublish ? (
            <span className="inline-flex items-center gap-2 text-caption text-success">
              <AppIcon
                icon={CheckCircle2}
                size={14}
                strokeWidth={1.3}
                decorative
              />
              {copy.okLabel}
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-caption text-foreground-secondary">
              <span className={MISSING_LBL_CLASS}>{copy.missingLabel}</span>
              {missing.map((label) => (
                <span key={label} className={MISSING_CHIP_CLASS}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={BTN_GROUP_CLASS}>
          <button
            type="button"
            disabled={isLoading}
            onClick={onSaveDraft}
            className={buttonClass("ghost")}
          >
            {copy.saveDraft}
          </button>
          <button
            type="button"
            disabled={!canPublish || isLoading}
            title={canPublish ? undefined : copy.publishHelp}
            onClick={onPublish}
            className={buttonClass("primary", PUBLISH_BTN_CLASS)}
          >
            {copy.publish}
          </button>
        </div>
      </div>
      {error && <FormAlert variant="error" message={error} className="mt-3" />}
    </div>
  );
}
