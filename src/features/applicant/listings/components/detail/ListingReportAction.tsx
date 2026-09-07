"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import type { ListingReportReason } from "../../api/listing-report";
import { listingDetailCopy } from "../../copy/listing-detail";
import { useListingReport } from "../../hooks/useListingReport";
import { ListingReportDialog } from "./ListingReportDialog";

interface ListingReportActionProps {
  listingId: string;
}

const WRAPPER_CLASS = "w-fit max-w-full";

const { report } = listingDetailCopy;

export function ListingReportAction({ listingId }: ListingReportActionProps) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [syncedListingId, setSyncedListingId] = useState(listingId);
  const {
    status,
    error,
    validationCode,
    submit,
    acknowledgeReason,
    acknowledgeDetail,
    reset,
  } = useListingReport(listingId);
  const pending = status === "submitting";

  if (listingId !== syncedListingId) {
    setSyncedListingId(listingId);
    setReported(false);
    setOpen(false);
  }

  const handleClose = () => {
    if (pending) return;
    setOpen(false);
    reset();
  };

  const handleSubmit = (reason: ListingReportReason | null, detail: string) => {
    void submit(reason, detail).then((result) => {
      if (!result) return;
      setOpen(false);
      setReported(true);
      reset();
    });
  };

  return (
    <div className={WRAPPER_CLASS}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <AppIcon icon={Flag} size={14} strokeWidth={1.8} decorative />
        {report.label}
      </Button>
      {reported ? (
        <p
          role="status"
          className="mt-1 text-caption text-foreground-secondary"
        >
          {report.success}
        </p>
      ) : null}
      <ListingReportDialog
        open={open}
        pending={pending}
        error={error}
        validationCode={validationCode}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onReasonSelected={acknowledgeReason}
        onDetailEdited={acknowledgeDetail}
      />
    </div>
  );
}
