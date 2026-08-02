import { FormAlert } from "@/components/ui/form/FormAlert";
import {
  type ChecklistItem,
  type ChecklistVariant,
  CompletionChecklist,
} from "@/components/ui/checklist/CompletionChecklist";
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

interface MissingChecklistProps {
  missing: ReadonlyArray<string>;
  canPublish: boolean;
  variant: ChecklistVariant;
}

export const CHECKLIST_ITEMS: ReadonlyArray<ChecklistItem> = [
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

export function MissingChecklist({
  missing,
  canPublish,
  variant,
}: MissingChecklistProps) {
  const copy = createListingCopy.abschluss.actions;

  return (
    <CompletionChecklist
      items={CHECKLIST_ITEMS}
      missing={missing}
      complete={canPublish}
      variant={variant}
      missingLabel={copy.missingLabel}
      okLabel={copy.okLabel}
    />
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
