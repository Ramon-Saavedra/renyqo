"use client";

import { useCallback, useState } from "react";
import { Pencil } from "lucide-react";
import type { ListingDetail } from "../../types";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { STICKY_HEAD_CLASS } from "../../sticky-head";
import { listingEditCopy } from "../copy";
import { useListingEdit } from "../useListingEdit";
import { AddressEditCard } from "./AddressEditCard";
import { DescriptionEditCard } from "./DescriptionEditCard";
import { EditableGallery } from "./EditableGallery";
import { FactsEditCard } from "./FactsEditCard";
import { ListingEditHead } from "./ListingEditHead";
import { RequirementsEditCard } from "./RequirementsEditCard";

interface ListingEditViewProps {
  listing: ListingDetail;
  onCancel: () => void;
  onSaved: (updated: ListingDetail) => void;
}

const COLUMN_CONTAINER = "flex flex-col gap-5 lg:flex-row lg:items-start";
const LEFT_COLUMN = "contents lg:flex lg:w-3/5 lg:min-w-0 lg:flex-col lg:gap-5";
const RIGHT_COLUMN =
  "contents lg:flex lg:w-2/5 lg:min-w-0 lg:flex-col lg:gap-5";
const NOTICE_CLASS =
  "mt-4 rounded-md border border-primary-soft bg-primary-tint px-4 py-3 text-caption font-medium text-primary";
const ERROR_CLASS =
  "mt-4 rounded-md border border-border bg-background px-4 py-3 text-caption text-foreground-secondary";

export function ListingEditView({
  listing,
  onCancel,
  onSaved,
}: ListingEditViewProps) {
  const { form, errors, status, error, isDirty, savedFields, setField, save } =
    useListingEdit(listing, { onSaved });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const saving = status === "saving";
  const saved = status === "saved";

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowDiscardModal(true);
      return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  const keepEditing = useCallback(() => setShowDiscardModal(false), []);
  const confirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    onCancel();
  }, [onCancel]);

  return (
    <>
      <div className={STICKY_HEAD_CLASS}>
        <ListingEditHead
          form={form}
          status={listing.status}
          setField={setField}
          errors={errors}
          saving={saving}
          saved={saved}
          savedFields={savedFields}
          onSave={save}
          onCancel={handleCancel}
        />

        {error ? (
          <div className={ERROR_CLASS} role="alert">
            {error}
          </div>
        ) : null}

        {saved ? (
          <FormAlert
            variant="success"
            message={listingEditCopy.savedNotice}
            className="mt-4"
          />
        ) : isDirty ? (
          <div className={NOTICE_CLASS} role="status">
            {listingEditCopy.unsavedNotice}
          </div>
        ) : null}
      </div>

      <div className={COLUMN_CONTAINER}>
        <div className={LEFT_COLUMN}>
          <EditableGallery
            listingId={listing.id}
            images={listing.images}
            className="order-1 lg:order-0"
          />
          <DescriptionEditCard
            form={form}
            setField={setField}
            savedFields={savedFields}
            className="order-3 lg:order-0"
          />
          <RequirementsEditCard
            form={form}
            setField={setField}
            errors={errors}
            savedFields={savedFields}
            className="order-4 lg:order-0"
          />
        </div>
        <div className={RIGHT_COLUMN}>
          <FactsEditCard
            form={form}
            setField={setField}
            errors={errors}
            savedFields={savedFields}
            className="order-2 lg:order-0"
          />
          <AddressEditCard
            form={form}
            setField={setField}
            savedFields={savedFields}
            className="order-5 lg:order-0"
          />
        </div>
      </div>

      <ConfirmationModal
        open={showDiscardModal}
        title={listingEditCopy.discardModal.title}
        text={listingEditCopy.discardModal.text}
        primaryLabel={listingEditCopy.discardModal.primary}
        secondaryLabel={listingEditCopy.discardModal.secondary}
        onPrimary={keepEditing}
        onSecondary={confirmDiscard}
        icon={Pencil}
      />
    </>
  );
}
