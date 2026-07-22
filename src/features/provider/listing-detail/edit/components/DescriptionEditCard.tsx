import { cn } from "@/lib/utils/cn";
import { FormField } from "@/components/ui/form/FormField";
import { Textarea } from "@/components/ui/form/Textarea";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailCard } from "../../components/DetailCard";
import type { ChangedFields } from "../changed-fields";
import { listingEditCopy } from "../copy";
import type { EditFieldSetter, ListingEditForm } from "../types";

interface DescriptionEditCardProps {
  form: ListingEditForm;
  setField: EditFieldSetter;
  savedFields: ChangedFields;
  className?: string;
}

const DESCRIPTION_MAX_LENGTH = 800;

export function DescriptionEditCard({
  form,
  setField,
  savedFields,
  className,
}: DescriptionEditCardProps) {
  return (
    <DetailCard
      title={listingDetailCopy.description.title}
      className={cn("bg-background-subtle", className)}
    >
      <FormField
        label={listingEditCopy.fields.description}
        htmlFor="edit-description"
      >
        <Textarea
          id="edit-description"
          rows={5}
          value={form.shortDescription}
          placeholder={listingEditCopy.fields.descriptionPlaceholder}
          saved={savedFields.has("shortDescription")}
          onChange={(e) =>
            setField(
              "shortDescription",
              e.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
            )
          }
        />
      </FormField>
    </DetailCard>
  );
}
