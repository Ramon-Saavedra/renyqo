"use client";

import { Smile } from "lucide-react";
import { FormField } from "@/components/ui/form/FormField";
import { Textarea } from "@/components/ui/form/Textarea";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { SectionCard } from "@/components/ui/section-card/SectionCard";
import { applicantProfileCopy } from "../copy/applicant-profile";
import type { ApplicantProfileDraft } from "../utils/profile-validation";

interface IntroductionSectionProps {
  draft: ApplicantProfileDraft;
  setField: <K extends keyof ApplicantProfileDraft>(
    field: K,
    value: ApplicantProfileDraft[K],
  ) => void;
  error?: string | undefined;
}

const MAX_INTRODUCTION_LENGTH = 100;

export function IntroductionSection({
  draft,
  setField,
  error,
}: IntroductionSectionProps) {
  const copy = applicantProfileCopy.introduction;

  return (
    <SectionCard
      id="sec-introduction"
      num={copy.num}
      title={copy.title}
      description={copy.description}
    >
      <FormField
        label={copy.field.label}
        htmlFor="applicant-introduction"
        required
        labelTrailing={
          <span className="font-mono text-meta tabular-nums text-foreground-tertiary">
            {draft.introduction.length}
            {copy.field.counterSuffix}
          </span>
        }
      >
        <Textarea
          id="applicant-introduction"
          rows={3}
          value={draft.introduction}
          required
          maxLength={MAX_INTRODUCTION_LENGTH}
          aria-invalid={error ? true : undefined}
          placeholder={copy.field.placeholder}
          onChange={(event) => setField("introduction", event.target.value)}
        />
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-1.5 text-caption leading-normal text-foreground-tertiary"
          >
            <span>{error}</span>
            <AppIcon icon={Smile} size={16} strokeWidth={1.75} decorative />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-caption leading-normal text-foreground-tertiary">
            <span>{copy.field.guidance}</span>
            <AppIcon icon={Smile} size={16} strokeWidth={1.75} decorative />
          </div>
        )}
      </FormField>
    </SectionCard>
  );
}
