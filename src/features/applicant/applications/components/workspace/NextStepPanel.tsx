import { useId, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Info,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import type { ViewingInterest } from "../../api/shared-schemas";
import { applicationsCopy } from "../../copy";
import type { NextStepItem } from "../../model/pending-actions";

const copy = applicationsCopy.nextStep;

export interface InterestControl {
  readonly canSubmit: (viewingId: string) => boolean;
  readonly pending: boolean;
  readonly failed: boolean;
  readonly isBlocked: (viewingId: string) => boolean;
  readonly conflict: boolean;
  readonly submit: (
    viewingId: string,
    interest: ViewingInterest,
  ) => Promise<boolean>;
}

const INTEREST_LABEL: Record<ViewingInterest, string> = {
  STILL_INTERESTED: copy.interest.yes,
  NOT_INTERESTED: copy.interest.no,
};

function InterestPrompt({
  viewingId,
  control,
}: {
  readonly viewingId: string;
  readonly control: InterestControl;
}) {
  const [choice, setChoice] = useState<ViewingInterest | null>(null);
  const confirmId = useId();
  const blocked = control.pending || control.isBlocked(viewingId);

  if (!control.canSubmit(viewingId)) return null;

  if (choice) {
    return (
      <div
        role="group"
        aria-labelledby={confirmId}
        className="flex flex-col gap-3 rounded-md border border-primary-soft bg-background-muted px-2.5 py-4 sm:px-4"
      >
        <div>
          <p id={confirmId} className="text-lead font-medium text-foreground">
            {copy.interest.choice(INTEREST_LABEL[choice])}
          </p>
          <p className="mt-0.5 text-body text-foreground-secondary">
            {copy.interest.confirmHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={blocked}
            onClick={() => {
              void control.submit(viewingId, choice).then((done) => {
                if (done) setChoice(null);
              });
            }}
          >
            <AppIcon icon={Send} size={15} strokeWidth={2} decorative />
            {control.pending ? copy.interest.submitting : copy.interest.submit}
          </Button>
          <Button
            variant="ghost"
            size="md"
            disabled={control.pending}
            onClick={() => setChoice(null)}
          >
            {copy.interest.back}
          </Button>
        </div>
        {control.failed ? (
          <p role="alert" className="text-caption text-warning">
            {control.conflict
              ? applicationsCopy.viewing.conflict
              : copy.interest.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="group"
        aria-label={copy.interest.groupLabel}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant="primary"
          disabled={blocked}
          onClick={() => setChoice("STILL_INTERESTED")}
        >
          <AppIcon icon={ThumbsUp} size={16} strokeWidth={2} decorative />
          {copy.interest.yes}
        </Button>
        <Button
          variant="outline"
          disabled={blocked}
          onClick={() => setChoice("NOT_INTERESTED")}
        >
          <AppIcon icon={ThumbsDown} size={16} strokeWidth={2} decorative />
          {copy.interest.no}
        </Button>
      </div>
      <p className="flex items-start gap-1.5 text-caption text-foreground-secondary">
        <AppIcon icon={Info} size={14} className="mt-0.5" decorative />
        {copy.interest.finalHint}
      </p>
    </div>
  );
}

interface NextStepPanelProps {
  readonly items: readonly NextStepItem[];
  readonly interest: InterestControl;
  readonly onNavigate: (item: NextStepItem) => void;
  readonly onSelect: (key: string) => void;
  readonly isUploadBlocked: (requestId: string) => boolean;
  readonly canUpload: (requestId: string) => boolean;
}

export function NextStepPanel({
  items,
  interest,
  onNavigate,
  onSelect,
  isUploadBlocked,
  canUpload,
}: NextStepPanelProps) {
  const headingId = useId();
  const [primary, ...rest] = items;
  if (!primary) return null;
  const primaryInterest =
    primary.intent.kind === "answer-interest" ? primary.intent : null;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-md border border-primary-soft bg-primary-tint px-3.5 py-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2
          id={headingId}
          className="font-display text-meta font-semibold uppercase text-primary"
        >
          {copy.heading}
        </h2>
        <span className="text-caption text-foreground-secondary">
          {copy.count(items.length)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3.5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <AppIcon icon={primary.icon} size={20} decorative />
        </span>
        <div className="min-w-0 flex-1 basis-40 sm:basis-64">
          <p className="font-display text-heading-md font-semibold text-foreground">
            {primary.title}
          </p>
          <p className="mt-1 max-w-prose text-body text-pretty text-foreground-secondary">
            {primary.text}
          </p>
        </div>
        {primaryInterest ? null : (
          <Button
            variant="primary"
            disabled={
              primary.intent.kind === "upload" &&
              (!canUpload(primary.intent.requestId) ||
                isUploadBlocked(primary.intent.requestId))
            }
            onClick={() => onNavigate(primary)}
          >
            {primary.cta}
            <AppIcon icon={ArrowRight} size={16} decorative />
          </Button>
        )}
      </div>
      {primaryInterest ? (
        <InterestPrompt
          key={primaryInterest.viewingId}
          viewingId={primaryInterest.viewingId}
          control={interest}
        />
      ) : null}
      {rest.length > 0 ? (
        <div className="flex flex-col gap-0.5 border-t border-primary-soft pt-3">
          <p className="mb-1 text-caption text-foreground-secondary">
            {copy.alsoOpen}
          </p>
          <ul className="flex flex-col">
            {rest.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={
                    item.intent.kind === "upload" &&
                    (!canUpload(item.intent.requestId) ||
                      isUploadBlocked(item.intent.requestId))
                  }
                  onClick={() =>
                    item.intent.kind === "answer-interest"
                      ? onSelect(item.key)
                      : onNavigate(item)
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-sm px-0 py-1.5 text-left text-body text-foreground hover:bg-primary-soft focus-visible:outline-none focus-visible:shadow-focus sm:-mx-2.5 sm:px-2.5"
                >
                  <AppIcon
                    icon={item.icon}
                    size={17}
                    className="text-primary"
                    decorative
                  />
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <span className="text-caption font-medium text-primary">
                    {item.cta}
                  </span>
                  <AppIcon
                    icon={ChevronRight}
                    size={16}
                    className="text-primary"
                    decorative
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function CalmNextStep({ extra }: { readonly extra: string | null }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-background-muted px-3.5 py-4 sm:p-6"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-background-subtle text-foreground-secondary"
      >
        <AppIcon icon={CircleCheck} size={20} decorative />
      </span>
      <div className="min-w-0 flex-1 basis-40 sm:basis-64">
        <p className="font-display text-meta font-semibold uppercase text-foreground-secondary">
          {copy.heading}
        </p>
        <h2
          id={headingId}
          className="mt-0.5 font-display text-heading-md font-semibold text-foreground"
        >
          {copy.calmTitle}
        </h2>
        <p className="mt-0.5 text-body text-pretty text-foreground-secondary">
          {copy.calmText}
          {extra}
        </p>
      </div>
    </section>
  );
}
