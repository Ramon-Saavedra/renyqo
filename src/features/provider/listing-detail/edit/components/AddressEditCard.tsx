import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailCard } from "../../components/DetailCard";
import type { ChangedFields } from "../changed-fields";
import { listingEditCopy } from "../copy";
import type { EditFieldSetter, ListingEditForm } from "../types";

interface AddressEditCardProps {
  form: ListingEditForm;
  setField: EditFieldSetter;
  savedFields: ChangedFields;
  className?: string;
}

const { fields } = listingEditCopy;

export function AddressEditCard({
  form,
  setField,
  savedFields,
  className,
}: AddressEditCardProps) {
  return (
    <DetailCard title={listingDetailCopy.address.title} className={className}>
      <div className="flex flex-col gap-4">
        <FormField label={fields.street} htmlFor="edit-street">
          <Input
            id="edit-street"
            value={form.street}
            saved={savedFields.has("street")}
            onChange={(e) => setField("street", e.target.value)}
          />
        </FormField>
        <div className="flex gap-3">
          <FormField
            label={fields.zip}
            htmlFor="edit-zip"
            className="w-32 shrink-0"
          >
            <Input
              id="edit-zip"
              value={form.zip}
              inputMode="numeric"
              saved={savedFields.has("zip")}
              onChange={(e) => setField("zip", e.target.value)}
            />
          </FormField>
          <FormField
            label={fields.city}
            htmlFor="edit-city"
            className="min-w-0 flex-1"
          >
            <Input
              id="edit-city"
              value={form.city}
              saved={savedFields.has("city")}
              onChange={(e) => setField("city", e.target.value)}
            />
          </FormField>
        </div>
        <CardCheckbox
          id="edit-show-exact-address"
          checked={form.showExactAddress}
          onChange={(value) => setField("showExactAddress", value)}
          description={fields.showExactAddressHint}
          saved={savedFields.has("showExactAddress")}
        >
          {fields.showExactAddress}
        </CardCheckbox>
      </div>
    </DetailCard>
  );
}
