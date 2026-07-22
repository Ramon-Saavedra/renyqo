import type {
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { Segmented } from "@/components/ui/form/Segmented";
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

const { fields, suffix } = listingEditCopy;

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
          <FormField
            label={fields.peopleCount}
            error={errors.suitableForPeopleCount}
          >
            <NumberStepper
              value={form.suitableForPeopleCount}
              onChange={(value) => setField("suitableForPeopleCount", value)}
              min={1}
              max={12}
              allowNull
              nullLabel={fields.peopleCountEmpty}
              ariaLabel={fields.peopleCount}
              saved={savedFields.has("suitableForPeopleCount")}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={fields.pets}>
            <Segmented<PetPolicyBackend | "">
              value={form.petsPolicy}
              onChange={(value) =>
                setField("petsPolicy", value as PetPolicyBackend | "")
              }
              options={PET_POLICY_OPTIONS}
              saved={savedFields.has("petsPolicy")}
            />
          </FormField>
          <FormField label={fields.smoking}>
            <Segmented<SmokingPolicyBackend | "">
              value={form.smokingPolicy}
              onChange={(value) =>
                setField("smokingPolicy", value as SmokingPolicyBackend | "")
              }
              options={SMOKING_POLICY_OPTIONS}
              saved={savedFields.has("smokingPolicy")}
            />
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
