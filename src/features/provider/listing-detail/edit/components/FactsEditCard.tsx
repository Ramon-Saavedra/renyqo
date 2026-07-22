import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { Select } from "@/components/ui/form/Select";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailCard } from "../../components/DetailCard";
import type { ChangedFields } from "../changed-fields";
import { listingEditCopy } from "../copy";
import type {
  EditFieldSetter,
  ListingEditErrors,
  ListingEditForm,
} from "../types";
import { BEDROOM_OPTIONS } from "@/features/provider/create-listing/copy/create-listing";

interface FactsEditCardProps {
  form: ListingEditForm;
  setField: EditFieldSetter;
  errors: ListingEditErrors;
  savedFields: ChangedFields;
  className?: string;
}

const { fields, suffix } = listingEditCopy;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function decimalOnly(value: string): string {
  return value.replace(/[^\d.,]/g, "");
}

export function FactsEditCard({
  form,
  setField,
  errors,
  savedFields,
  className,
}: FactsEditCardProps) {
  return (
    <DetailCard title={listingDetailCopy.facts.title} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.coldRent}
          htmlFor="edit-cold-rent"
          error={errors.coldRent}
        >
          <InputAffix suffix={suffix.perMonth}>
            <Input
              id="edit-cold-rent"
              inputMode="numeric"
              value={form.coldRent}
              saved={savedFields.has("coldRent")}
              onChange={(e) => setField("coldRent", digitsOnly(e.target.value))}
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.additionalCosts}
          htmlFor="edit-additional-costs"
          error={errors.additionalCosts}
        >
          <InputAffix suffix={suffix.perMonth}>
            <Input
              id="edit-additional-costs"
              inputMode="numeric"
              value={form.additionalCosts}
              saved={savedFields.has("additionalCosts")}
              onChange={(e) =>
                setField("additionalCosts", digitsOnly(e.target.value))
              }
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.deposit}
          htmlFor="edit-deposit"
          error={errors.deposit}
        >
          <InputAffix suffix={suffix.euro}>
            <Input
              id="edit-deposit"
              inputMode="numeric"
              value={form.deposit}
              saved={savedFields.has("deposit")}
              onChange={(e) => setField("deposit", digitsOnly(e.target.value))}
              className="pr-9"
            />
          </InputAffix>
        </FormField>
        <FormField label={fields.depositMonths}>
          <NumberStepper
            value={form.depositMonths}
            onChange={(value) => setField("depositMonths", value)}
            min={1}
            max={3}
            allowNull
            ariaLabel={fields.depositMonths}
            saved={savedFields.has("depositMonths")}
          />
        </FormField>
        <FormField
          label={fields.livingArea}
          htmlFor="edit-living-area"
          error={errors.livingArea}
        >
          <InputAffix suffix={suffix.area}>
            <Input
              id="edit-living-area"
              inputMode="numeric"
              value={form.livingArea}
              saved={savedFields.has("livingArea")}
              onChange={(e) =>
                setField("livingArea", digitsOnly(e.target.value))
              }
              className="pr-13"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.rooms}
          htmlFor="edit-rooms"
          error={errors.rooms}
        >
          <Input
            id="edit-rooms"
            inputMode="decimal"
            value={form.rooms}
            saved={savedFields.has("rooms")}
            onChange={(e) => setField("rooms", decimalOnly(e.target.value))}
          />
        </FormField>
        <FormField label={fields.bedrooms} htmlFor="edit-bedrooms">
          <Select
            id="edit-bedrooms"
            value={form.bedrooms}
            onChange={(e) => setField("bedrooms", e.target.value)}
          >
            <option value="">{listingEditCopy.emptyOption}</option>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(".", ",")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={fields.availableFrom} htmlFor="edit-available-from">
          <Input
            id="edit-available-from"
            type="date"
            value={form.availableFrom}
            saved={savedFields.has("availableFrom")}
            onChange={(e) => setField("availableFrom", e.target.value)}
          />
        </FormField>
      </div>
    </DetailCard>
  );
}
