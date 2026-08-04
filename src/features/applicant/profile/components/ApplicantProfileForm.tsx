"use client";

import { CheckCircle2, Shield } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { Note } from "@/components/ui/form/Note";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoReveal } from "@/components/ui/loading/RenyqoReveal";
import { applicantProfileCopy } from "../copy/applicant-profile";
import { useApplicantProfile } from "../hooks/useApplicantProfile";
import { ApplicantProfileHero } from "./ApplicantProfileHero";
import { DocumentsSection } from "./DocumentsSection";
import { HouseholdSection } from "./HouseholdSection";
import { ProfileActionsBar } from "./ProfileActionsBar";
import { ProfileChecklist } from "./ProfileChecklist";
import { ProfileSaveErrorBanner } from "./ProfileSaveErrorBanner";
import { ProfileSectionSkeleton } from "./ProfileSectionSkeleton";

const SAVED_PIP_CLASS =
  "inline-flex items-center gap-1.5 font-mono text-meta uppercase text-success";
const COLUMN_CLASS = "flex flex-col gap-4.5";

export function ApplicantProfileForm() {
  const {
    draft,
    setField,
    loading,
    loadFailed,
    saveStatus,
    save,
    errors,
    missing,
    complete,
    canSave,
  } = useApplicantProfile();

  const copy = applicantProfileCopy;

  return (
    <>
      <AppTopbar className="sticky top-0 z-30 mb-section bg-background">
        {saveStatus === "saved" && (
          <span className={SAVED_PIP_CLASS} aria-live="polite">
            <AppIcon
              icon={CheckCircle2}
              size={12}
              strokeWidth={1.8}
              decorative
            />
            <span className="sr-only lg:not-sr-only">{copy.topbar.saved}</span>
          </span>
        )}
        <AccountMenu />
      </AppTopbar>

      <div className="px-gutter">
        <ApplicantProfileHero />

        {loadFailed && (
          <FormAlert
            variant="error"
            message={copy.actions.loadError}
            className="mb-4.5"
          />
        )}

        {saveStatus === "error" && <ProfileSaveErrorBanner onRetry={save} />}

        <div className="listing-grid">
          <ProfileChecklist
            missing={missing}
            complete={complete}
            variant="rail"
          />

          <div className={COLUMN_CLASS}>
            <RenyqoReveal
              loading={loading}
              skeleton={<ProfileSectionSkeleton rows={1} paired />}
            >
              <HouseholdSection
                draft={draft}
                setField={setField}
                errors={errors}
              />
            </RenyqoReveal>

            <RenyqoReveal
              loading={loading}
              stagger={0.12}
              skeleton={<ProfileSectionSkeleton rows={2} paired />}
            >
              <DocumentsSection draft={draft} setField={setField} />
            </RenyqoReveal>

            {!loading && (
              <>
                <Note icon={Shield}>{copy.note.body}</Note>

                <ProfileActionsBar
                  missing={missing}
                  complete={complete}
                  canSave={canSave}
                  saveStatus={saveStatus}
                  onSave={save}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
