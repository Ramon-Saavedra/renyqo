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
import type { ListingDraft } from "../hooks/useListingDraft";
import { SectionCard } from "./SectionCard";

interface AnforderungenSectionProps {
  draft: ListingDraft;
  setField: <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => void;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function totalLabel(adults: number | null, kids: number | null): string {
  const fields = createListingCopy.anforderungen.fields.total;
  if (adults === null && kids === null) return fields.empty;
  const total = (adults ?? 0) + (kids ?? 0);
  return `${total} Person${total === 1 ? "" : "en"}`;
}

export function AnforderungenSection({
  draft,
  setField,
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

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={fields.adults.label}>
          <NumberStepper
            value={draft.adults}
            onChange={(value) => setField("adults", value)}
            min={1}
            max={8}
            allowNull
            ariaLabel={fields.adults.label}
          />
        </FormField>
        <FormField label={fields.kids.label}>
          <NumberStepper
            value={draft.kids}
            onChange={(value) => setField("kids", value)}
            min={0}
            max={8}
            allowNull
            ariaLabel={fields.kids.label}
          />
        </FormField>
        <FormField label={fields.total.label}>
          <div className="flex h-11 items-center justify-between rounded-md border border-border-strong bg-background-muted px-3.5 text-action text-foreground-secondary">
            <span>{totalLabel(draft.adults, draft.kids)}</span>
            <span className="font-mono text-meta tracking-widest text-foreground-tertiary">
              {fields.total.auto}
            </span>
          </div>
        </FormField>
      </div>

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
    </SectionCard>
  );
}
