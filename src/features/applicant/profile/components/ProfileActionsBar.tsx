"use client";

import { FieldError } from "@/components/ui/form/FieldError";
import { LoadingButton } from "@/components/ui/loading/LoadingButton";
import { applicantProfileCopy } from "../copy/applicant-profile";
import type { ProfileSaveStatus } from "../hooks/useApplicantProfile";
import { ProfileChecklist } from "./ProfileChecklist";

interface ProfileActionsBarProps {
  missing: ReadonlyArray<string>;
  complete: boolean;
  canSave: boolean;
  saveStatus: ProfileSaveStatus;
  onSave: () => void;
}

const WRAPPER_CLASS =
  "flex flex-col gap-4 rounded-md border border-border bg-background px-7 py-5.5";
const ROW_CLASS = "flex flex-wrap items-center justify-between gap-4";

export function ProfileActionsBar({
  missing,
  complete,
  canSave,
  saveStatus,
  onSave,
}: ProfileActionsBarProps) {
  const copy = applicantProfileCopy.actions;

  return (
    <div className={WRAPPER_CLASS}>
      <div className={ROW_CLASS}>
        <ProfileChecklist
          missing={missing}
          complete={complete}
          variant="inline"
        />

        <LoadingButton
          variant="primary"
          className="min-w-42"
          disabled={
            !canSave || saveStatus === "saving" || saveStatus === "saved"
          }
          loading={saveStatus === "saving"}
          loadingLabel={copy.saving}
          success={saveStatus === "saved"}
          successLabel={copy.saved}
          onClick={onSave}
        >
          {copy.save}
        </LoadingButton>
      </div>

      {!canSave && <FieldError message={copy.invalidHint} />}
    </div>
  );
}
