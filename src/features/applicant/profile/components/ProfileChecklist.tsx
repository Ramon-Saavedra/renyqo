"use client";

import {
  type ChecklistVariant,
  CompletionChecklist,
} from "@/components/ui/checklist/CompletionChecklist";
import { applicantProfileCopy } from "../copy/applicant-profile";
import { PROFILE_CHECKLIST_ITEMS } from "../utils/profile-validation";

interface ProfileChecklistProps {
  missing: ReadonlyArray<string>;
  complete: boolean;
  variant: ChecklistVariant;
}

export function ProfileChecklist({
  missing,
  complete,
  variant,
}: ProfileChecklistProps) {
  const copy = applicantProfileCopy.actions;

  return (
    <CompletionChecklist
      items={PROFILE_CHECKLIST_ITEMS}
      missing={missing}
      complete={complete}
      variant={variant}
      missingLabel={copy.missingLabel}
      okLabel={copy.okLabel}
    />
  );
}
