"use client";

import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { SectionStepper } from "@/components/ui/section-stepper/SectionStepper";
import { createListingCopy, SECTION_IDS } from "../copy/create-listing";
import { useActiveStepFromScroll } from "../hooks/useActiveStepFromScroll";
import { useAutoSaveIndicator } from "../hooks/useAutoSaveIndicator";
import { useAutoTitle } from "../hooks/useAutoTitle";
import { useListingDraft } from "../hooks/useListingDraft";
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
    address: draft.address,
  });
  const { missing, canPublish, completedSteps } = useListingValidation(draft);

  const finalTitle = draft.titleOverride.trim() || autoTitle;
  const stepperSteps = createListingCopy.stepper.steps;

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
              setField={setField}
              setPhotos={setPhotos}
            />
            <AnforderungenSection draft={draft} setField={setField} />
            <AbschlussSection draft={draft} setField={setField} />
            <ActionsBar missing={missing} canPublish={canPublish} />
          </div>
          <PreviewCard draft={draft} finalTitle={finalTitle} />
        </div>
      </div>
    </>
  );
}
