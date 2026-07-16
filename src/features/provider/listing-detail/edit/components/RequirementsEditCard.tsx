import type {
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { Select } from "@/components/ui/form/Select";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailCard } from "../../components/DetailCard";
import type { ChangedFields } from "../changed-fields";
import {
  listingEditCopy,
  PET_POLICY_OPTIONS,
  SMOKING_POLICY_OPTIONS,
} from "../copy";
import type {
  EditFieldSetter,
  ListingEditErrors,
  ListingEditForm,
} from "../types";

interface RequirementsEditCardProps {
  form: ListingEditForm;
  setField: EditFieldSetter;
  errors: ListingEditErrors;
  savedFields: ChangedFields;
  className?: string;
}

const { fields, suffix, emptyOption } = listingEditCopy;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function RequirementsEditCard({
  form,
  setField,
  errors,
  savedFields,
  className,
}: RequirementsEditCardProps) {
  return (
    <DetailCard
      title={listingDetailCopy.requirements.title}
      className={className}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={fields.minimumIncome}
            htmlFor="edit-min-income"
            error={errors.minimumHouseholdNetIncome}
          >
            <InputAffix suffix={suffix.perMonth}>
              <Input
                id="edit-min-income"
                inputMode="numeric"
                value={form.minimumHouseholdNetIncome}
                saved={savedFields.has("minimumHouseholdNetIncome")}
                onChange={(e) =>
                  setField(
                    "minimumHouseholdNetIncome",
                    digitsOnly(e.target.value),
                  )
                }
                className="pr-22"
              />
            </InputAffix>
          </FormField>
          <FormField label={fields.peopleCount}>
            <NumberStepper
              value={form.suitableForPeopleCount}
              onChange={(value) => setField("suitableForPeopleCount", value)}
              min={1}
              max={12}
              allowNull
              ariaLabel={fields.peopleCount}
              saved={savedFields.has("suitableForPeopleCount")}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={fields.pets} htmlFor="edit-pets">
            <Select
              id="edit-pets"
              value={form.petsPolicy}
              saved={savedFields.has("petsPolicy")}
              onChange={(e) =>
                setField("petsPolicy", e.target.value as PetPolicyBackend | "")
              }
            >
              <option value="">{emptyOption}</option>
              {PET_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={fields.smoking} htmlFor="edit-smoking">
            <Select
              id="edit-smoking"
              value={form.smokingPolicy}
              saved={savedFields.has("smokingPolicy")}
              onChange={(e) =>
                setField(
                  "smokingPolicy",
                  e.target.value as SmokingPolicyBackend | "",
                )
              }
            >
              <option value="">{emptyOption}</option>
              {SMOKING_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <CardCheckbox
          id="edit-schufa-required"
          checked={form.schufaRequired}
          onChange={(value) => setField("schufaRequired", value)}
          saved={savedFields.has("schufaRequired")}
        >
          {fields.schufaRequired}
        </CardCheckbox>
        <CardCheckbox
          id="edit-income-proof-required"
          checked={form.incomeProofRequired}
          onChange={(value) => setField("incomeProofRequired", value)}
          saved={savedFields.has("incomeProofRequired")}
        >
          {fields.incomeProofRequired}
        </CardCheckbox>
      </div>
    </DetailCard>
  );
}
