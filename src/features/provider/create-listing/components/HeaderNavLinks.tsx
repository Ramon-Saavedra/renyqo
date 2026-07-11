"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { Building2, LayoutGrid, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { createListingCopy } from "../copy/create-listing";

interface HeaderNavLinksProps {
  hasUnsavedChanges: boolean;
  canSaveBeforeLeave: boolean;
  isSavingBeforeLeave: boolean;
  saveBeforeLeaveError: string | null;
  onSaveBeforeLeave: (href: string) => Promise<boolean>;
}

const NAV_CLASS = "mb-6 flex items-center justify-end gap-5";
const LINK_CLASS =
  "inline-flex items-center gap-1.5 text-caption text-foreground-tertiary transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

export function HeaderNavLinks({
  hasUnsavedChanges,
  canSaveBeforeLeave,
  isSavingBeforeLeave,
  saveBeforeLeaveError,
  onSaveBeforeLeave,
}: HeaderNavLinksProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showSaveError, setShowSaveError] = useState(false);
  const copy = createListingCopy.headerNav;

  const guardNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!hasUnsavedChanges) return;

    event.preventDefault();
    setShowSaveError(false);
    setPendingHref(href);
  };

  const continueNavigation = () => {
    if (pendingHref) {
      router.push(pendingHref);
    }
    setPendingHref(null);
  };

  const keepEditing = () => {
    if (isSavingBeforeLeave) return;
    setShowSaveError(false);
    setPendingHref(null);
  };

  const saveAndContinueNavigation = async () => {
    if (!pendingHref || !canSaveBeforeLeave) return;

    setShowSaveError(false);
    const saved = await onSaveBeforeLeave(pendingHref);
    if (!saved) {
      setShowSaveError(true);
    }
  };

  return (
    <>
      <nav className={NAV_CLASS} aria-label={copy.dashboard}>
        <Link
          href={copy.myListingsHref}
          className={LINK_CLASS}
          onClick={(event) => guardNavigation(event, copy.myListingsHref)}
        >
          <AppIcon icon={Building2} size={13} strokeWidth={1.6} decorative />
          {copy.myListings}
        </Link>
        <Link
          href={copy.dashboardHref}
          className={LINK_CLASS}
          onClick={(event) => guardNavigation(event, copy.dashboardHref)}
        >
          <AppIcon icon={LayoutGrid} size={13} strokeWidth={1.6} decorative />
          {copy.dashboard}
        </Link>
      </nav>

      <ConfirmationModal
        open={pendingHref !== null}
        title={copy.unsavedChangesModal.title}
        text={copy.unsavedChangesModal.text}
        primaryLabel={copy.unsavedChangesModal.primary}
        secondaryLabel={copy.unsavedChangesModal.secondary}
        tertiaryLabel={
          canSaveBeforeLeave ? copy.unsavedChangesModal.tertiary : undefined
        }
        tertiaryPendingLabel={copy.unsavedChangesModal.tertiaryPending}
        onPrimary={keepEditing}
        onSecondary={continueNavigation}
        onTertiary={saveAndContinueNavigation}
        tertiaryPending={isSavingBeforeLeave}
        error={
          showSaveError
            ? saveBeforeLeaveError || copy.unsavedChangesModal.saveError
            : null
        }
        icon={Sparkles}
      />
    </>
  );
}
