"use client";

import { useCallback } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { SectionStepper } from "@/components/ui/section-stepper/SectionStepper";
import { createListingCopy, SECTION_IDS } from "../copy/create-listing";
import { useActiveStepFromScroll } from "../hooks/useActiveStepFromScroll";
import { useAutoSaveIndicator } from "../hooks/useAutoSaveIndicator";
import { useAutoTitle } from "../hooks/useAutoTitle";
import { useCreateListing } from "../hooks/useCreateListing";
import { useListingDraft } from "../hooks/useListingDraft";
import type {
  ListingDraft,
  ListingDraftErrors,
  ListingPhoto,
} from "../hooks/useListingDraft";
import { useListingValidation } from "../hooks/useListingValidation";
import { AbschlussSection } from "./AbschlussSection";
import { ActionsBar } from "./ActionsBar";
import { AnforderungenSection } from "./AnforderungenSection";
import { CreateListingHero } from "./CreateListingHero";
import { ObjektdatenSection } from "./ObjektdatenSection";
import { PreviewCard } from "./PreviewCard";
import { TopbarActions } from "./TopbarActions";

export function CreateListingForm() {
  const { draft, setField, setPhotos } = useListingDraft();
  const { status } = useAutoSaveIndicator([draft]);
  const activeStepId = useActiveStepFromScroll(SECTION_IDS);
  const { autoTitle } = useAutoTitle({
    objectType: draft.objectType,
    rooms: draft.rooms,
    city: draft.city,
  });
  const { missing, canPublish, completedSteps } = useListingValidation(draft);
  const {
    submitStatus,
    error,
    fieldErrors,
    saveDraft,
    publish,
    clearFieldError,
  } = useCreateListing();

  const handleSetField = <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => {
    setField(field, value);
    clearFieldError(field as keyof ListingDraftErrors);
  };

  const handleSetPhotos = useCallback(
    (photos: ReadonlyArray<ListingPhoto>) => {
      setPhotos(photos);
      clearFieldError("photos");
    },
    [setPhotos, clearFieldError],
  );

  const finalTitle = draft.titleOverride.trim() || autoTitle;
  const stepperSteps = createListingCopy.stepper.steps;
  const isLoading = submitStatus !== "idle";

  return (
    <>
      <AppTopbar className="mb-section">
        <TopbarActions status={status} />
      </AppTopbar>

      <div className="px-gutter">
        <CreateListingHero />

        <SectionStepper
          steps={stepperSteps}
          activeId={activeStepId}
          completedIds={completedSteps}
          ariaLabel={createListingCopy.stepper.ariaLabel}
          className="mb-6"
        />

        <div className="listing-grid">
          <div className="flex flex-col gap-4.5">
            <ObjektdatenSection
              draft={draft}
              setField={handleSetField}
              setPhotos={handleSetPhotos}
              fieldErrors={fieldErrors}
            />
            <AnforderungenSection draft={draft} setField={handleSetField} />
            <AbschlussSection
              draft={draft}
              setField={handleSetField}
              fieldErrors={fieldErrors}
            />
            <ActionsBar
              missing={missing}
              canPublish={canPublish}
              onSaveDraft={() => saveDraft(draft, finalTitle)}
              onPublish={() => publish(draft, finalTitle)}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <PreviewCard draft={draft} finalTitle={finalTitle} />
        </div>
      </div>
    </>
  );
}
