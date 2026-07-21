"use client";

import { Shield } from "lucide-react";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { Note } from "@/components/ui/form/Note";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { Segmented } from "@/components/ui/form/Segmented";
import {
  createListingCopy,
  type PetOption,
  type RequirementOption,
  type SmokingOption,
} from "../copy/create-listing";
import type {
  ListingDraft,
  ListingDraftErrors,
} from "../hooks/useListingDraft";
import { SectionCard } from "./SectionCard";

interface AnforderungenSectionProps {
  draft: ListingDraft;
  setField: <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => void;
  fieldErrors?: ListingDraftErrors;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function AnforderungenSection({
  draft,
  setField,
  fieldErrors,
}: AnforderungenSectionProps) {
  const copy = createListingCopy.anforderungen;
  const fields = copy.fields;
  const note = copy.note;

  return (
    <SectionCard
      id="sec-02"
      num={copy.num}
      title={copy.title}
      description={copy.description}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.minIncome.label}
          htmlFor="min-income"
          hint={fields.minIncome.hint}
          error={fieldErrors?.minIncome}
        >
          <InputAffix suffix={fields.minIncome.suffix}>
            <Input
              id="min-income"
              inputMode="numeric"
              value={draft.minIncome}
              placeholder={fields.minIncome.placeholder}
              onChange={(e) =>
                setField("minIncome", digitsOnly(e.target.value))
              }
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField label={fields.schufa.label}>
          <Segmented<RequirementOption>
            value={draft.schufa}
            onChange={(value) => setField("schufa", value)}
            options={fields.schufa.options.map((o) => ({
              value: o.value as RequirementOption,
              label: o.label,
            }))}
          />
        </FormField>
        <FormField label={fields.income.label} className="sm:col-span-2">
          <Segmented<RequirementOption>
            value={draft.income}
            onChange={(value) => setField("income", value)}
            options={fields.income.options.map((o) => ({
              value: o.value as RequirementOption,
              label: o.label,
            }))}
          />
        </FormField>
      </div>

      <Note icon={Shield}>
        <strong className="font-semibold text-foreground">{note.lead}</strong>{" "}
        {note.body}
      </Note>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.pets.label}>
          <Segmented<PetOption>
            value={draft.pets}
            onChange={(value) => setField("pets", value)}
            options={fields.pets.options.map((o) => ({
              value: o.value as PetOption,
              label: o.label,
            }))}
          />
        </FormField>
        <FormField label={fields.smoking.label}>
          <Segmented<SmokingOption>
            value={draft.smoking}
            onChange={(value) => setField("smoking", value)}
            options={fields.smoking.options.map((o) => ({
              value: o.value as SmokingOption,
              label: o.label,
            }))}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.peopleCount.label}
          error={fieldErrors?.peopleCount}
        >
          <NumberStepper
            value={draft.peopleCount}
            onChange={(value) => setField("peopleCount", value)}
            min={1}
            max={12}
            allowNull
            nullLabel={fields.peopleCount.empty}
            ariaLabel={fields.peopleCount.label}
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
