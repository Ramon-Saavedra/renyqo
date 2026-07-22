"use client";

import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { createListingCopy } from "../copy/create-listing";
import { FieldError } from "@/components/ui/form/FieldError";
import type {
  ListingDraft,
  ListingDraftErrors,
} from "../hooks/useListingDraft";
import { SectionCard } from "./SectionCard";

interface AbschlussSectionProps {
  draft: ListingDraft;
  setField: <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => void;
  fieldErrors?: ListingDraftErrors;
}

const PILL_CLASS =
  "inline-flex items-center gap-1.5 rounded-sm bg-background-muted px-2 py-1 font-mono text-meta uppercase text-foreground-secondary";

const PIP_CLASS = "h-1.25 w-1.25 rounded-full bg-current";

export function AbschlussSection({
  draft,
  setField,
  fieldErrors,
}: AbschlussSectionProps) {
  const copy = createListingCopy.abschluss;
  return (
    <SectionCard
      id="sec-03"
      num={copy.num}
      title={copy.title}
      description={copy.description}
      className="bg-background"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={PILL_CLASS}>
          <span aria-hidden="true" className={PIP_CLASS} />
          {copy.statusPill}
        </span>
        <span className="text-caption text-foreground-tertiary">
          {copy.statusHint}
        </span>
      </div>

      <CardCheckbox
        id="legal-accepted"
        checked={draft.legalAccepted}
        onChange={(value) => setField("legalAccepted", value)}
        description={copy.legal.sub}
      >
        {copy.legal.label}
      </CardCheckbox>
      {fieldErrors?.legalAccepted && (
        <FieldError message={fieldErrors.legalAccepted} />
      )}
    </SectionCard>
  );
}
