"use client";

import { AlertTriangle, Check, CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { CompletionChecklist } from "@/components/ui/checklist/CompletionChecklist";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type { ListingExtractionResult } from "@/lib/api/listing-assistance";
import { createListingCopy } from "../copy/create-listing";
import {
  buildExtractionChecklistState,
  buildPostApplyChecklistState,
  countRecognizedFields,
} from "../hooks/aiExtractionChecklist";
import type { AiCaptureSubmittedInput } from "../hooks/useAiCapture";
import type { ExtractionFieldDescriptor } from "../hooks/listingExtractionMapping";
import { mapExtractionWarning } from "../hooks/listingExtractionMapping";

const copy = createListingCopy.aiCapture;

function SubmittedInputSummary({
  submittedInput,
}: {
  submittedInput: AiCaptureSubmittedInput | null;
}) {
  if (!submittedInput) return null;

  const submittedCopy = copy.submittedInput;
  let detail: string | null = null;
  if (submittedInput.mode === "text" && submittedInput.text) {
    detail = submittedInput.text;
  } else if (submittedInput.mode === "pdf" && submittedInput.pdfFileName) {
    detail = submittedInput.pdfFileName;
  } else if (
    submittedInput.mode === "voice" &&
    submittedInput.voiceDurationLabel
  ) {
    detail = `${submittedCopy.voiceMode} · ${submittedInput.voiceDurationLabel}`;
  }

  if (!detail) return null;

  const modeLabel =
    submittedInput.mode === "text"
      ? submittedCopy.textMode
      : submittedInput.mode === "pdf"
        ? submittedCopy.pdfMode
        : submittedCopy.voiceMode;

  return (
    <div className="mb-4 rounded-md border border-border bg-background px-3.5 py-3">
      <div className="mb-1.5 font-mono text-meta uppercase text-foreground-secondary">
        {submittedCopy.label}
      </div>
      <div className="mb-1 text-caption text-foreground-tertiary">
        {modeLabel}
      </div>
      <p className="whitespace-pre-wrap text-caption leading-normal text-foreground">
        {detail}
      </p>
    </div>
  );
}

function ExtractionWarnings({ warnings }: { warnings: readonly string[] }) {
  if (warnings.length === 0) return null;

  const uniqueMessages = Array.from(
    new Set(warnings.map((warning) => mapExtractionWarning(warning))),
  );

  return (
    <div className="mb-4 rounded-md border border-border border-l-2 border-l-warning bg-background px-3.5 py-3">
      <p className="mb-2 text-caption font-medium text-foreground">
        {copy.warnings.title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {uniqueMessages.map((message) => (
          <li
            key={message}
            className="flex items-start gap-1.5 text-caption leading-normal text-foreground-secondary"
          >
            <AppIcon
              icon={AlertTriangle}
              size={13}
              strokeWidth={1.4}
              decorative
              className="mt-0.5 shrink-0 text-warning"
            />
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FoundFieldsSection({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) return null;

  return (
    <div className="mb-4 border-t border-border pt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-meta uppercase text-foreground-secondary">
          {copy.result.foundLabel}
        </span>
        <span className="rounded-sm border border-border bg-background px-1.25 py-0.25 font-mono text-meta text-foreground-tertiary">
          {labels.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1 text-caption text-foreground"
          >
            <AppIcon
              icon={CheckCircle2}
              size={12}
              strokeWidth={1.6}
              decorative
              className="text-success"
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AiCaptureResultPane({
  result,
  descriptors,
  submittedInput,
  onApply,
  onEditInput,
  onReanalyze,
  onReset,
}: {
  result: ListingExtractionResult;
  descriptors: readonly ExtractionFieldDescriptor[];
  submittedInput: AiCaptureSubmittedInput | null;
  onApply: () => void;
  onEditInput: () => void;
  onReanalyze: () => void;
  onReset: () => void;
}) {
  const checklist = buildExtractionChecklistState(result, descriptors);
  const totalFound = countRecognizedFields(descriptors);
  const foundLabels = descriptors.map((descriptor) => descriptor.label);

  return (
    <div>
      <SubmittedInputSummary submittedInput={submittedInput} />
      <ExtractionWarnings warnings={result.warnings} />

      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border",
            checklist.required.complete
              ? "border-success text-success"
              : "border-warning text-warning",
          )}
        >
          <AppIcon
            icon={checklist.required.complete ? Check : AlertTriangle}
            size={14}
            strokeWidth={1.7}
            decorative
          />
        </span>
        <div>
          <h4 className="font-display text-body font-medium text-foreground">
            {copy.result.title}
          </h4>
          <p className="text-caption text-foreground-secondary">
            {totalFound}{" "}
            {totalFound === 1
              ? copy.result.summarySingular
              : copy.result.summaryPlural}{" "}
            {checklist.required.complete
              ? copy.result.allRequiredComplete
              : checklist.required.missing.length === 1
                ? copy.result.missingRequiredSingular
                : copy.result.missingRequiredPlural}
          </p>
        </div>
      </div>

      <FoundFieldsSection labels={foundLabels} />

      <CompletionChecklist
        items={checklist.required.items}
        missing={checklist.required.missing}
        complete={checklist.required.complete}
        variant="panel"
        missingLabel={copy.result.missingLabel}
        okLabel={copy.result.requiredComplete}
        hint={copy.guide.requiredHint}
        className="mb-3"
      />

      <CompletionChecklist
        items={checklist.recommended.items}
        missing={checklist.recommended.missing}
        complete={checklist.recommended.complete}
        variant="panel"
        missingLabel={copy.guide.recommendedLabel}
        okLabel={copy.result.recommendedComplete}
        hint={copy.guide.recommendedHint}
        className="mb-3"
      />

      {!checklist.optional.complete && (
        <CompletionChecklist
          items={checklist.optional.items}
          missing={checklist.optional.missing}
          complete={false}
          variant="panel"
          missingLabel={copy.result.optionalLabel}
          okLabel={copy.result.optionalComplete}
          hint={copy.guide.optionalHint}
          className="mb-3"
        />
      )}

      {!checklist.check.complete && (
        <CompletionChecklist
          items={checklist.check.items}
          missing={checklist.check.missing}
          complete={false}
          variant="panel"
          missingLabel={copy.result.checkLabel}
          okLabel={copy.result.checkComplete}
          className="mb-3"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onApply}
          disabled={totalFound === 0}
          className={buttonClass("primary")}
        >
          {copy.result.apply}
        </button>
        <button
          type="button"
          onClick={onEditInput}
          className={buttonClass("secondary")}
        >
          {copy.result.editInput}
        </button>
        <button
          type="button"
          onClick={onReanalyze}
          className={buttonClass("ghost")}
        >
          {copy.result.reanalyze}
        </button>
        <button
          type="button"
          onClick={onReset}
          className={buttonClass("ghost")}
        >
          {copy.result.newInput}
        </button>
      </div>
    </div>
  );
}

export function AiCaptureAppliedPane({
  appliedCount,
  submittedInput,
  hasPhotos,
  hasDescription,
  onClose,
  onAddMore,
}: {
  appliedCount: number;
  submittedInput: AiCaptureSubmittedInput | null;
  hasPhotos: boolean;
  hasDescription: boolean;
  onClose: () => void;
  onAddMore: () => void;
}) {
  const nextSteps = buildPostApplyChecklistState(hasPhotos, hasDescription);

  return (
    <div>
      <SubmittedInputSummary submittedInput={submittedInput} />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-success text-success">
          <AppIcon icon={Check} size={14} strokeWidth={1.7} decorative />
        </span>
        <div>
          <h4 className="font-display text-body font-medium text-foreground">
            {copy.result.appliedTitle}
          </h4>
          <p className="text-caption text-foreground-secondary">
            {appliedCount}{" "}
            {appliedCount === 1
              ? copy.result.transferredSingular
              : copy.result.transferredPlural}
          </p>
        </div>
      </div>

      <CompletionChecklist
        items={nextSteps.items}
        missing={nextSteps.missing}
        complete={nextSteps.complete}
        variant="panel"
        missingLabel={copy.result.nextStepsLabel}
        okLabel={copy.result.nextStepsComplete}
        className="mt-4"
      />

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className={buttonClass("primary")}
        >
          {copy.result.closePanel}
        </button>
        <button
          type="button"
          onClick={onAddMore}
          className={buttonClass("ghost")}
        >
          {copy.result.addMore}
        </button>
      </div>
    </div>
  );
}
