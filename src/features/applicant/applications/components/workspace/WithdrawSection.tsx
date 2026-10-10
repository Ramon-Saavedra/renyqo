import { useId, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { useListingWithdrawal } from "@/features/applicant/listings/hooks/useListingWithdrawal";
import type { ApplicationStatus } from "../../api/shared-schemas";
import { applicationsCopy } from "../../copy";

const copy = applicationsCopy.withdraw;

interface WithdrawSectionProps {
  readonly applicationId: string;
  readonly listingTitle: string;
  readonly status: ApplicationStatus;
  readonly onWithdrawn: () => number;
  readonly acceptedGeneration: number;
  readonly className?: string | undefined;
}

export function WithdrawSection({
  applicationId,
  listingTitle,
  status,
  onWithdrawn,
  acceptedGeneration,
  className,
}: WithdrawSectionProps) {
  const headingId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [requiredGeneration, setRequiredGeneration] = useState<number | null>(
    null,
  );
  const requiredGenerationRef = useRef<number | null>(null);
  const { state, withdraw, reset } = useListingWithdrawal(applicationId);
  const pending = state.status === "submitting";
  const synchronizing =
    requiredGeneration !== null && acceptedGeneration < requiredGeneration;

  const close = () => {
    if (pending) return;
    setOpen(false);
    reset();
  };

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-parent-x py-parent-y">
        <div className="min-w-0 flex-1 basis-72">
          <h2 id={headingId} className="text-lead font-medium text-foreground">
            {copy.title}
          </h2>
          <p className="mt-0.5 text-body text-pretty text-foreground-secondary">
            {status === "WAITING" ? copy.waitingText : copy.activeText}
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className={buttonClass("danger")}
          aria-haspopup="dialog"
          disabled={pending || synchronizing}
          onClick={() => {
            if (
              pending ||
              (requiredGenerationRef.current !== null &&
                acceptedGeneration < requiredGenerationRef.current)
            )
              return;
            reset();
            setOpen(true);
          }}
        >
          <AppIcon icon={Undo2} size={15} decorative />
          {copy.action}
        </button>
      </div>
      <ConfirmationModal
        open={open}
        icon={Undo2}
        title={copy.dialogTitle}
        text={copy.dialogText(listingTitle)}
        primaryLabel={copy.confirm}
        primaryPendingLabel={copy.pending}
        primaryPending={pending}
        primaryDisabled={synchronizing}
        primaryVariant="danger"
        secondaryLabel={copy.cancel}
        closeLabel={copy.cancel}
        error={state.status === "error" ? copy.error : null}
        focusFallbackRef={triggerRef}
        onClose={close}
        onSecondary={close}
        onPrimary={() => {
          if (
            requiredGenerationRef.current !== null &&
            acceptedGeneration < requiredGenerationRef.current
          )
            return;
          void withdraw().then((done) => {
            if (!done) return;
            setOpen(false);
            const generation = onWithdrawn();
            requiredGenerationRef.current = generation;
            setRequiredGeneration(generation);
          });
        }}
      />
    </section>
  );
}
