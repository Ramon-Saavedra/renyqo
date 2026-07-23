import { Building2, DoorOpen, Home, MapPin } from "lucide-react";
import type { ObjectTypeBackend } from "@/lib/api/listings";
import { DateTimeBadge } from "@/components/ui/date-time-badge/DateTimeBadge";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { Segmented } from "@/components/ui/form/Segmented";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { StatusPill } from "../../../listings-overview/components/StatusPill";
import { formatDateTime } from "../../../listings-overview/utils/format";
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
  savedFields: ChangedFields;
  publishedAt: string | null;
  updatedAt: string | null;
  headerAddress: string;
}

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
  savedFields,
  publishedAt,
  updatedAt,
  headerAddress,
}: ListingEditHeadProps) {
  const timestamp = publishedAt ?? updatedAt;
  const timestampLabel = timestamp ? formatDateTime(timestamp) : null;
  const timestampTitle = publishedAt
    ? `Veröffentlicht am ${timestampLabel}`
    : `Aktualisiert am ${timestampLabel}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={status} />
        {timestampLabel ? (
          <DateTimeBadge
            value={timestampLabel}
            title={timestampTitle}
            className="h-7 px-2 text-meta"
          />
        ) : null}
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

      <span className="flex items-center gap-1.5 text-body text-foreground-secondary">
        <AppIcon
          icon={MapPin}
          size={13}
          strokeWidth={1.6}
          decorative
          className="text-foreground-tertiary"
        />
        {headerAddress}
      </span>
    </div>
  );
}
