"use client";

import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { Segmented } from "@/components/ui/form/Segmented";
import { SectionCard } from "@/components/ui/section-card/SectionCard";
import {
  applicantProfileCopy,
  type SmokerOption,
  type YesNoOption,
} from "../copy/applicant-profile";
import type { ApplicantProfileDraft } from "../utils/profile-validation";

interface DocumentsSectionProps {
  draft: ApplicantProfileDraft;
  setField: <K extends keyof ApplicantProfileDraft>(
    field: K,
    value: ApplicantProfileDraft[K],
  ) => void;
}

export function DocumentsSection({ draft, setField }: DocumentsSectionProps) {
  const copy = applicantProfileCopy.documents;
  const fields = copy.fields;

  return (
    <SectionCard
      id="sec-documents"
      num={copy.num}
      title={copy.title}
      description={copy.description}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.incomeProof.label} required>
          <div id="income-proof">
            <Segmented<YesNoOption>
              value={draft.incomeProof}
              onChange={(value) => setField("incomeProof", value)}
              ariaLabel={fields.incomeProof.label}
              options={fields.incomeProof.options.map((option) => ({
                value: option.value as YesNoOption,
                label: option.label,
              }))}
            />
          </div>
        </FormField>
        <FormField label={fields.schufa.label} required>
          <div id="schufa">
            <Segmented<YesNoOption>
              value={draft.schufa}
              onChange={(value) => setField("schufa", value)}
              ariaLabel={fields.schufa.label}
              options={fields.schufa.options.map((option) => ({
                value: option.value as YesNoOption,
                label: option.label,
              }))}
            />
          </div>
        </FormField>
      </div>

      <p className="text-caption leading-normal text-foreground-tertiary">
        {copy.hint}
      </p>

      <FormField label={fields.pets.label} required>
        <div id="pets">
          <Segmented<YesNoOption>
            value={draft.pets}
            onChange={(value) => setField("pets", value)}
            ariaLabel={fields.pets.label}
            options={fields.pets.options.map((option) => ({
              value: option.value as YesNoOption,
              label: option.label,
            }))}
          />
        </div>
      </FormField>

      {draft.pets === "ja" && (
        <FormField label={fields.petsNote.label} htmlFor="pets-note">
          <Input
            id="pets-note"
            value={draft.petsNote}
            maxLength={fields.petsNote.maxLength}
            placeholder={fields.petsNote.placeholder}
            onChange={(event) => setField("petsNote", event.target.value)}
          />
        </FormField>
      )}

      <FormField label={fields.smoker.label} required>
        <div id="smoker">
          <Segmented<SmokerOption>
            value={draft.smoker}
            onChange={(value) => setField("smoker", value)}
            ariaLabel={fields.smoker.label}
            options={fields.smoker.options.map((option) => ({
              value: option.value as SmokerOption,
              label: option.label,
            }))}
          />
        </div>
      </FormField>
    </SectionCard>
  );
}
