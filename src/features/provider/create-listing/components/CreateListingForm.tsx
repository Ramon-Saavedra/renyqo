"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { SectionStepper } from "@/components/ui/section-stepper/SectionStepper";
import { getProviderListings } from "@/features/provider/listings-overview/api/provider-listings";
import { createListingCopy, SECTION_IDS } from "../copy/create-listing";
import { useActiveStepFromScroll } from "../hooks/useActiveStepFromScroll";
import { useAutoTitle } from "../hooks/useAutoTitle";
import {
  hasMeaningfulDraftContent,
  useCreateListing,
} from "../hooks/useCreateListing";
import { INITIAL_DRAFT, useListingDraft } from "../hooks/useListingDraft";
import type {
  ListingDraft,
  ListingDraftErrors,
  ListingPhoto,
} from "../hooks/useListingDraft";
import { useListingValidation } from "../hooks/useListingValidation";
import { AbschlussSection } from "./AbschlussSection";
import {
  ActionsBar,
  CHECKLIST_ITEMS,
  MissingChecklist,
  scrollToMissingField,
} from "./ActionsBar";
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
  const router = useRouter();
  const [cleanDraft, setCleanDraft] = useState<ListingDraft>(INITIAL_DRAFT);
  const [cleanStatus, setCleanStatus] = useState<ListingSaveStatus>("idle");
  const [hasSaveError, setHasSaveError] = useState(false);
  const [hasProviderListings, setHasProviderListings] = useState<
    boolean | null
  >(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showSaveBeforeLeaveError, setShowSaveBeforeLeaveError] =
    useState(false);
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
  const heroTitle =
    hasProviderListings === null
      ? createListingCopy.hero.fallbackTitle
      : hasProviderListings
        ? createListingCopy.hero.nextTitle
        : createListingCopy.hero.title;
  const hasUnsavedChanges = !areDraftsEqual(draft, cleanDraft);
  const canSaveBeforeLeave = hasMeaningfulDraftContent(draft);
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

  const handleSaveDraftAndLeave = useCallback(
    async (href: string) => {
      const saveResult = await saveDraft(draft, finalTitle, {
        redirectTo: href,
      });
      if (saveResult === "saved") {
        setCleanDraft(draft);
        setCleanStatus("saved");
        setHasSaveError(false);
        return true;
      }
      if (saveResult === "error") {
        setHasSaveError(true);
      } else {
        setHasSaveError(false);
      }
      return false;
    },
    [draft, finalTitle, saveDraft],
  );

  const guardNavigation = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      setShowSaveBeforeLeaveError(false);
      setPendingHref(href);
    },
    [hasUnsavedChanges],
  );

  const keepEditing = useCallback(() => {
    if (submitStatus === "saving") return;
    setShowSaveBeforeLeaveError(false);
    setPendingHref(null);
  }, [submitStatus]);

  const continueNavigation = useCallback(() => {
    if (pendingHref) {
      router.push(pendingHref);
    }
    setPendingHref(null);
  }, [pendingHref, router]);

  const saveAndContinueNavigation = useCallback(async () => {
    if (!pendingHref || !canSaveBeforeLeave) return;

    setShowSaveBeforeLeaveError(false);
    const saved = await handleSaveDraftAndLeave(pendingHref);
    if (!saved) {
      setShowSaveBeforeLeaveError(true);
    }
  }, [canSaveBeforeLeave, handleSaveDraftAndLeave, pendingHref]);

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

  useEffect(() => {
    let active = true;

    getProviderListings()
      .then((listings) => {
        if (active) setHasProviderListings(listings.length > 0);
      })
      .catch(() => {
        if (active) setHasProviderListings(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AppTopbar
        className="sticky top-0 z-30 mb-section bg-background"
        logoHref={createListingCopy.headerNav.dashboardHref}
        onLogoClick={(event) =>
          guardNavigation(event, createListingCopy.headerNav.dashboardHref)
        }
      >
        <TopbarActions
          status={saveStatus}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onBackClick={(event) =>
            guardNavigation(event, createListingCopy.topbar.backHref)
          }
        />
      </AppTopbar>

      <div className="px-gutter">
        <CreateListingHero title={heroTitle} />

        <HeaderNavLinks onNavigate={guardNavigation} />

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
              onPublish={() => {
                if (!canPublish && missing.length > 0) {
                  const item = CHECKLIST_ITEMS.find(
                    (i) => i.label === missing[0],
                  );
                  if (item) scrollToMissingField(item.targetId);
                }
                publish(draft, finalTitle);
              }}
              submitStatus={submitStatus}
              error={error}
            />
          </div>
          <PreviewCard draft={draft} finalTitle={finalTitle} />
        </div>
      </div>

      <ConfirmationModal
        open={pendingHref !== null}
        title={createListingCopy.headerNav.unsavedChangesModal.title}
        text={createListingCopy.headerNav.unsavedChangesModal.text}
        primaryLabel={createListingCopy.headerNav.unsavedChangesModal.primary}
        secondaryLabel={
          createListingCopy.headerNav.unsavedChangesModal.secondary
        }
        tertiaryLabel={
          canSaveBeforeLeave
            ? createListingCopy.headerNav.unsavedChangesModal.tertiary
            : undefined
        }
        tertiaryPendingLabel={
          createListingCopy.headerNav.unsavedChangesModal.tertiaryPending
        }
        onPrimary={keepEditing}
        onSecondary={continueNavigation}
        onTertiary={saveAndContinueNavigation}
        tertiaryPending={submitStatus === "saving"}
        error={
          showSaveBeforeLeaveError
            ? error || createListingCopy.headerNav.unsavedChangesModal.saveError
            : null
        }
        icon={Sparkles}
      />
    </>
  );
}
