import { Building2, DoorOpen, Home } from "lucide-react";
import type { ObjectTypeBackend } from "@/lib/api/listings";
import { buttonClass } from "@/components/ui/button/Button";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { LoadingButton } from "@/components/ui/loading/LoadingButton";
import { Segmented } from "@/components/ui/form/Segmented";
import { cn } from "@/lib/utils/cn";
import { StatusPill } from "../../../listings-overview/components/StatusPill";
import type { ChangedFields } from "../changed-fields";
import { listingEditCopy, OBJECT_TYPE_OPTIONS } from "../copy";
import type {
  EditFieldSetter,
  ListingEditErrors,
  ListingEditForm,
} from "../types";
import type { ListingStatus } from "../../types";

interface ListingEditHeadProps {
  form: ListingEditForm;
  status: ListingStatus;
  setField: EditFieldSetter;
  errors: ListingEditErrors;
  saving: boolean;
  saved: boolean;
  savedFields: ChangedFields;
  onSave: () => void;
  onCancel: () => void;
}

const HEAD_CLASS =
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6";
const KICKER_CLASS = "mb-2 flex flex-wrap items-center gap-2";
const ACTIONS_CLASS = "flex flex-wrap items-center gap-2 max-sm:w-full";
const ACTION_BUTTON_CLASS = "min-w-32 justify-center max-sm:flex-1";

const OBJECT_TYPE_ICONS = {
  APARTMENT: Building2,
  HOUSE: Home,
  ROOM: DoorOpen,
} as const;

export function ListingEditHead({
  form,
  status,
  setField,
  errors,
  saving,
  saved,
  savedFields,
  onSave,
  onCancel,
}: ListingEditHeadProps) {
  return (
    <div className={HEAD_CLASS}>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className={KICKER_CLASS}>
          <StatusPill status={status} />
        </div>

        <FormField label={listingEditCopy.fields.objectType}>
          <Segmented<ObjectTypeBackend>
            value={form.objectType}
            onChange={(value) => setField("objectType", value)}
            options={OBJECT_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              icon: OBJECT_TYPE_ICONS[option.value],
            }))}
            ariaLabel={listingEditCopy.fields.objectType}
            saved={savedFields.has("objectType")}
          />
        </FormField>

        <FormField
          label={listingEditCopy.fields.title}
          htmlFor="edit-title"
          error={errors.title}
        >
          <Input
            id="edit-title"
            value={form.title}
            placeholder={listingEditCopy.fields.titlePlaceholder}
            saved={savedFields.has("title")}
            onChange={(e) => setField("title", e.target.value)}
          />
        </FormField>
      </div>

      <div className={ACTIONS_CLASS}>
        <LoadingButton
          variant="primary"
          onClick={onSave}
          loading={saving}
          loadingLabel={listingEditCopy.saving}
          success={saved}
          successLabel={listingEditCopy.saved}
          disabled={saving || saved}
          className={cn(ACTION_BUTTON_CLASS, saving && "cursor-progress")}
        >
          {listingEditCopy.save}
        </LoadingButton>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || saved}
          className={cn(buttonClass("secondary"), ACTION_BUTTON_CLASS)}
        >
          {listingEditCopy.cancel}
        </button>
      </div>
    </div>
  );
}
