"use client";

import { useCallback, useEffect, useState } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { SectionStepper } from "@/components/ui/section-stepper/SectionStepper";
import { createListingCopy, SECTION_IDS } from "../copy/create-listing";
import { useActiveStepFromScroll } from "../hooks/useActiveStepFromScroll";
import { useAutoTitle } from "../hooks/useAutoTitle";
import { useCreateListing } from "../hooks/useCreateListing";
import { INITIAL_DRAFT, useListingDraft } from "../hooks/useListingDraft";
import type {
  ListingDraft,
  ListingDraftErrors,
  ListingPhoto,
} from "../hooks/useListingDraft";
import { useListingValidation } from "../hooks/useListingValidation";
import { AbschlussSection } from "./AbschlussSection";
import { ActionsBar, MissingChecklist } from "./ActionsBar";
import { AnforderungenSection } from "./AnforderungenSection";
import { CreateListingHero } from "./CreateListingHero";
import { HeaderNavLinks } from "./HeaderNavLinks";
import { ObjektdatenSection } from "./ObjektdatenSection";
import { PreviewCard } from "./PreviewCard";
import { type ListingSaveStatus, TopbarActions } from "./TopbarActions";

function arePhotosEqual(
  left: ReadonlyArray<ListingPhoto>,
  right: ReadonlyArray<ListingPhoto>,
): boolean {
  return (
    left.length === right.length &&
    left.every((photo, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        photo.id === other.id &&
        photo.src === other.src &&
        photo.file === other.file
      );
    })
  );
}

function areDraftsEqual(left: ListingDraft, right: ListingDraft): boolean {
  return (
    left.city === right.city &&
    left.zip === right.zip &&
    left.street === right.street &&
    left.hideAddress === right.hideAddress &&
    left.objectType === right.objectType &&
    left.area === right.area &&
    left.rooms === right.rooms &&
    left.bedrooms === right.bedrooms &&
    left.price === right.price &&
    left.additionalCosts === right.additionalCosts &&
    left.deposit === right.deposit &&
    left.availableFrom === right.availableFrom &&
    left.titleOverride === right.titleOverride &&
    left.description === right.description &&
    arePhotosEqual(left.photos, right.photos) &&
    left.minIncome === right.minIncome &&
    left.schufa === right.schufa &&
    left.income === right.income &&
    left.adults === right.adults &&
    left.kids === right.kids &&
    left.pets === right.pets &&
    left.smoking === right.smoking &&
    left.legalAccepted === right.legalAccepted
  );
}

export function CreateListingForm() {
  const [cleanDraft, setCleanDraft] = useState<ListingDraft>(INITIAL_DRAFT);
  const [cleanStatus, setCleanStatus] = useState<ListingSaveStatus>("idle");
  const [hasSaveError, setHasSaveError] = useState(false);
  const { draft, canUndo, canRedo, setField, setPhotos, undo, redo } =
    useListingDraft();
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
    setHasSaveError(false);
    clearFieldError(field as keyof ListingDraftErrors);
  };

  const handleSetPhotos = useCallback(
    (photos: ReadonlyArray<ListingPhoto>) => {
      setPhotos(photos);
      setHasSaveError(false);
    },
    [setPhotos],
  );

  const finalTitle = draft.titleOverride.trim() || autoTitle;
  const stepperSteps = createListingCopy.stepper.steps;
  const hasUnsavedChanges = !areDraftsEqual(draft, cleanDraft);
  const saveStatus: ListingSaveStatus = hasSaveError
    ? "error"
    : hasUnsavedChanges
      ? "dirty"
      : cleanStatus;

  const handleSaveDraft = useCallback(async () => {
    const saveResult = await saveDraft(draft, finalTitle);
    if (saveResult === "saved") {
      setCleanDraft(draft);
      setCleanStatus("saved");
      setHasSaveError(false);
    } else if (saveResult === "error") {
      setHasSaveError(true);
    } else {
      setHasSaveError(false);
    }
  }, [draft, finalTitle, saveDraft]);

  const handleUndo = useCallback(() => {
    undo();
    setHasSaveError(false);
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setHasSaveError(false);
  }, [redo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase();
      if (!key) return;
      const commandPressed = event.ctrlKey || event.metaKey;
      const isUndo = commandPressed && !event.shiftKey && key === "z";
      const isRedoByY = commandPressed && !event.shiftKey && key === "y";
      const isRedoByShiftZ = event.metaKey && event.shiftKey && key === "z";

      if (isUndo && canUndo) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if ((isRedoByY || isRedoByShiftZ) && canRedo) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, handleRedo, handleUndo]);

  return (
    <>
      <AppTopbar className="sticky top-0 z-30 mb-section bg-background">
        <TopbarActions
          status={saveStatus}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </AppTopbar>

      <div className="px-gutter">
        <CreateListingHero />

        <HeaderNavLinks hasUnsavedChanges={hasUnsavedChanges} />

        <SectionStepper
          steps={stepperSteps}
          activeId={activeStepId}
          completedIds={completedSteps}
          ariaLabel={createListingCopy.stepper.ariaLabel}
          className="mb-6"
        />

        <div className="listing-grid">
          <MissingChecklist
            missing={missing}
            canPublish={canPublish}
            variant="rail"
          />
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
              onSaveDraft={handleSaveDraft}
              onPublish={() => publish(draft, finalTitle)}
              submitStatus={submitStatus}
              error={error}
            />
          </div>
          <PreviewCard draft={draft} finalTitle={finalTitle} />
        </div>
      </div>
    </>
  );
}
