"use client";

import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { SectionCard } from "@/components/ui/section-card/SectionCard";
import { applicantProfileCopy } from "../copy/applicant-profile";
import {
  ADULTS_MAX,
  ADULTS_MIN,
  CHILDREN_MAX,
  CHILDREN_MIN,
  formatHouseholdSize,
  getHouseholdSize,
  type ApplicantProfileDraft,
  type ApplicantProfileErrors,
} from "../utils/profile-validation";
import { HouseholdSizeBox } from "./HouseholdSizeBox";

interface HouseholdSectionProps {
  draft: ApplicantProfileDraft;
  setField: <K extends keyof ApplicantProfileDraft>(
    field: K,
    value: ApplicantProfileDraft[K],
  ) => void;
  errors?: ApplicantProfileErrors;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function HouseholdSection({
  draft,
  setField,
  errors,
}: HouseholdSectionProps) {
  const copy = applicantProfileCopy.household;
  const fields = copy.fields;

  return (
    <SectionCard
      id="sec-household"
      num={copy.num}
      title={copy.title}
      description={copy.description}
    >
      <FormField
        label={fields.income.label}
        htmlFor="household-income"
        required
        error={errors?.income}
      >
        <InputAffix suffix={fields.income.suffix}>
          <Input
            id="household-income"
            inputMode="numeric"
            value={draft.income}
            placeholder={fields.income.placeholder}
            onChange={(event) =>
              setField("income", digitsOnly(event.target.value))
            }
            className="pr-22"
          />
        </InputAffix>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.adults.label} required>
          <NumberStepper
            value={draft.adults}
            onChange={(value) => setField("adults", value ?? ADULTS_MIN)}
            min={ADULTS_MIN}
            max={ADULTS_MAX}
            ariaLabel={fields.adults.label}
          />
        </FormField>
        <FormField label={fields.children.label} required>
          <NumberStepper
            value={draft.children}
            onChange={(value) => setField("children", value ?? CHILDREN_MIN)}
            min={CHILDREN_MIN}
            max={CHILDREN_MAX}
            ariaLabel={fields.children.label}
          />
        </FormField>
      </div>

      <FormField label={fields.householdSize.label}>
        <HouseholdSizeBox
          value={formatHouseholdSize(getHouseholdSize(draft))}
        />
      </FormField>
    </SectionCard>
  );
}
