"use client";

import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  AlignLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileText,
  FileUp,
  Info,
  Mic,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { Segmented } from "@/components/ui/form/Segmented";
import { Textarea } from "@/components/ui/form/Textarea";
import { RenyqoLoadingDots } from "@/components/ui/loading/RenyqoLoadingDots";
import { cn } from "@/lib/utils/cn";
import type { ListingExtractionResult } from "@/lib/api/listing-assistance";
import { createListingCopy } from "../copy/create-listing";
import type {
  AiCaptureErrorKind,
  AiCaptureMode,
  UseAiCaptureResult,
} from "../hooks/useAiCapture";
import { useAiCapture } from "../hooks/useAiCapture";
import type { ExtractionFieldDescriptor } from "../hooks/listingExtractionMapping";
import {
  mapInconsistencyLabel,
  mapMissingFieldLabel,
} from "../hooks/listingExtractionMapping";
import type { ListingDraft } from "../hooks/useListingDraft";

interface AiCaptureSectionProps {
  setField: <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => void;
  className?: string;
}

const copy = createListingCopy.aiCapture;

const REQUIRED_GUIDE_FIELDS = [
  copy.missingFieldLabels.city,
  copy.missingFieldLabels.zip,
  copy.missingFieldLabels.street,
  copy.fieldLabels.objectType,
  copy.missingFieldLabels.livingArea,
  copy.missingFieldLabels.rooms,
  copy.missingFieldLabels.bedrooms,
  copy.missingFieldLabels.coldRent,
  copy.missingFieldLabels.availableFrom,
];

const RECOMMENDED_GUIDE_FIELDS = [
  copy.fieldLabels.minIncome,
  copy.fieldLabels.schufa,
  copy.fieldLabels.income,
  copy.fieldLabels.peopleCount,
  copy.fieldLabels.pets,
  copy.fieldLabels.smoking,
];

function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function hasDraggedFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function AiCaptureSection({
  setField,
  className,
}: AiCaptureSectionProps) {
  const capture = useAiCapture(setField);
  const panelId = useId();

  return (
    <section
      data-open={capture.isOpen}
      aria-label={copy.closed.title}
      className={cn(
        "rounded-md border border-border bg-background-subtle data-[open=true]:border-border-strong data-[open=true]:shadow-card",
        className,
      )}
    >
      {!capture.isOpen ? (
        <ClosedCard onOpen={capture.open} panelId={panelId} />
      ) : (
        <div id={panelId} className="p-5 sm:p-6">
          <PanelHeader onClose={capture.close} />

          {capture.stage === "input" && <InputStage capture={capture} />}
          {capture.stage === "processing" && (
            <ProcessingPane onCancel={capture.cancelProcessing} />
          )}
          {capture.stage === "result" && capture.result && (
            <ResultPane
              result={capture.result}
              descriptors={capture.descriptors}
              onApply={capture.apply}
              onReset={capture.reset}
            />
          )}
          {capture.stage === "applied" && (
            <AppliedPane
              appliedCount={capture.appliedCount}
              onClose={capture.close}
              onAddMore={capture.reset}
            />
          )}
          {capture.stage === "error" && (
            <ErrorPane
              kind={capture.errorKind}
              message={capture.errorMessage}
              onRetry={capture.retry}
              onReset={capture.reset}
            />
          )}
        </div>
      )}
    </section>
  );
}

function ClosedCard({
  onOpen,
  panelId,
}: {
  onOpen: () => void;
  panelId: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-controls={panelId}
      className="ai-glow flex w-full cursor-pointer items-center gap-5 rounded-md p-6 text-left focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-md border border-primary-soft bg-primary-tint text-primary">
        <AppIcon icon={Sparkles} size={22} strokeWidth={1.5} decorative />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-heading-md font-medium text-foreground">
          {copy.closed.title}
        </span>
        <span className="mt-1 block max-w-sm text-caption leading-normal text-foreground-secondary">
          {copy.closed.body}
        </span>
        <span className="mt-3 flex items-center gap-2 font-mono text-meta uppercase text-foreground-tertiary">
          {copy.closed.capabilities.map((capability, index) => (
            <span key={capability} className="flex items-center gap-2">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="h-0.75 w-0.75 rounded-full bg-border-strong"
                />
              )}
              {capability}
            </span>
          ))}
        </span>
      </span>
      <AppIcon
        icon={ChevronRight}
        size={16}
        strokeWidth={1.6}
        decorative
        className="shrink-0 text-foreground-tertiary"
      />
    </button>
  );
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary-soft bg-primary-tint text-primary">
        <AppIcon icon={Sparkles} size={16} strokeWidth={1.5} decorative />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-heading-md font-medium text-foreground">
          {copy.panel.title}
        </h3>
        <p className="text-caption text-foreground-tertiary">
          {copy.panel.subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={copy.panel.closeLabel}
        className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-foreground-tertiary hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus"
      >
        <AppIcon icon={X} size={15} strokeWidth={1.6} decorative />
      </button>
    </div>
  );
}

function GuideFieldChips({
  items,
  variant,
}: {
  items: readonly string[];
  variant: "required" | "recommended";
}) {
  const itemClass =
    variant === "required"
      ? "inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-background-subtle px-2 py-1 text-caption text-foreground"
      : "inline-flex items-center gap-1.5 rounded-sm border border-dashed border-border-strong bg-transparent px-2 py-1 text-caption text-foreground-secondary";
  const pipClass =
    variant === "required"
      ? "h-1.25 w-1.25 rounded-full bg-primary"
      : "h-1.25 w-1.25 rounded-full border border-border-strong";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={itemClass}>
          <span aria-hidden="true" className={pipClass} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function GuideBlock({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = useId();
  return (
    <div className="mb-3.5 rounded-md border border-border bg-background">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <span className="font-mono text-meta uppercase text-foreground-secondary">
          {copy.guide.label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="cursor-pointer text-caption text-foreground-tertiary hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus"
        >
          {open ? copy.guide.hide : copy.guide.show}
        </button>
      </div>
      {open && (
        <div id={bodyId} className="border-t border-border px-3 py-3">
          <p className="mb-3 text-caption leading-normal text-foreground-tertiary">
            {copy.guide.note}
          </p>
          <div className="mb-1.5 text-caption text-foreground-secondary">
            {copy.guide.requiredLabel}
          </div>
          <GuideFieldChips items={REQUIRED_GUIDE_FIELDS} variant="required" />
          <div className="mt-3 border-t border-border pt-3">
            <div className="mb-1.5 text-caption text-foreground-tertiary">
              {copy.guide.recommendedLabel}
            </div>
            <GuideFieldChips
              items={RECOMMENDED_GUIDE_FIELDS}
              variant="recommended"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InputStage({ capture }: { capture: UseAiCaptureResult }) {
  return (
    <>
      <GuideBlock open={capture.guideOpen} onToggle={capture.toggleGuide} />
      <Segmented<AiCaptureMode>
        ariaLabel="Eingabemethode"
        value={capture.mode}
        onChange={capture.setMode}
        options={[
          { value: "pdf", label: copy.tabs.pdf, icon: FileText },
          { value: "text", label: copy.tabs.text, icon: AlignLeft },
          { value: "voice", label: copy.tabs.voice, icon: Mic },
        ]}
      />
      <div className="mt-4">
        {capture.mode === "pdf" && <PdfPane capture={capture} />}
        {capture.mode === "text" && <TextPane capture={capture} />}
        {capture.mode === "voice" && <VoicePane capture={capture} />}
      </div>
    </>
  );
}

function PdfPane({ capture }: { capture: UseAiCaptureResult }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const stop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) capture.pickPdfFile(file);
          e.target.value = "";
        }}
      />
      {!capture.pdf.file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            if (!hasDraggedFiles(e)) return;
            stop(e);
            dragDepthRef.current += 1;
            setIsDraggingFiles(true);
          }}
          onDragOver={(e) => {
            if (!hasDraggedFiles(e)) return;
            stop(e);
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            if (!hasDraggedFiles(e)) return;
            stop(e);
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) setIsDraggingFiles(false);
          }}
          onDrop={(e) => {
            if (!hasDraggedFiles(e)) return;
            stop(e);
            dragDepthRef.current = 0;
            setIsDraggingFiles(false);
            const file = e.dataTransfer.files[0];
            if (file) capture.pickPdfFile(file);
          }}
          className={cn("photo-drop w-full", isDraggingFiles && "is-active")}
        >
          <span className="photo-drop-ring">
            <span className="photo-drop-icon">
              <AppIcon icon={FileUp} size={18} strokeWidth={1.6} decorative />
            </span>
          </span>
          <span className="photo-drop-text">
            <strong className="photo-drop-title">{copy.pdf.dropTitle}</strong>
            <span className="photo-drop-action">
              {copy.pdf.dropAction}{" "}
              <span className="photo-drop-link">{copy.pdf.dropActionLink}</span>
            </span>
          </span>
          <span className="photo-drop-hint">{copy.pdf.dropHint}</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3.5 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-background-subtle text-primary">
            <AppIcon icon={FileText} size={15} strokeWidth={1.5} decorative />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-caption font-medium text-foreground">
              {capture.pdf.file.name}
            </b>
            <span className="font-mono text-meta text-foreground-tertiary">
              PDF ·{" "}
              {(capture.pdf.file.size / 1_048_576).toFixed(1).replace(".", ",")}{" "}
              MB
            </span>
          </span>
          <button
            type="button"
            onClick={capture.removePdfFile}
            className="cursor-pointer text-caption text-foreground-tertiary hover:text-foreground"
          >
            {copy.pdf.remove}
          </button>
        </div>
      )}
      {capture.pdf.error && (
        <FormAlert
          variant="error"
          message={capture.pdf.error}
          className="mt-3"
        />
      )}
      {capture.pdf.file && (
        <div className="mt-3.5 flex justify-end">
          <button
            type="button"
            disabled={!capture.canSubmit}
            onClick={capture.submit}
            className={buttonClass("primary")}
          >
            {copy.pdf.submit}
          </button>
        </div>
      )}
    </div>
  );
}

function TextPane({ capture }: { capture: UseAiCaptureResult }) {
  const trimmedLength = capture.text.trim().length;
  return (
    <div>
      <p className="mb-2.5 text-caption leading-normal text-foreground-secondary">
        {copy.text.lead}
      </p>
      <Textarea
        rows={5}
        value={capture.text}
        onChange={(e) => capture.setText(e.target.value)}
        placeholder={copy.text.placeholder}
        aria-label={copy.text.lead}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-meta tabular-nums text-foreground-tertiary">
          {trimmedLength} {copy.text.counterSuffix}
        </span>
        <button
          type="button"
          disabled={!capture.canSubmit}
          onClick={capture.submit}
          className={buttonClass("primary")}
        >
          {copy.text.submit}
        </button>
      </div>
      {trimmedLength > 0 && trimmedLength < 20 && (
        <p className="mt-1.5 text-caption text-foreground-tertiary">
          {copy.text.minHint}
        </p>
      )}
    </div>
  );
}

function VoicePane({ capture }: { capture: UseAiCaptureResult }) {
  const { voice } = capture;
  const formatted = formatSeconds(voice.seconds);

  return (
    <div className="flex flex-col items-center gap-3.5 rounded-md border border-border bg-background px-5 py-6 text-center">
      {voice.status === "idle" && (
        <>
          <p className="max-w-sm text-caption leading-normal text-foreground-secondary">
            {copy.voice.lead}
          </p>
          {!capture.voiceSupported && (
            <p className="text-caption text-warning">
              {copy.voice.unsupported}
            </p>
          )}
          {voice.error && (
            <p className="text-caption text-warning">{voice.error}</p>
          )}
          <button
            type="button"
            disabled={!capture.voiceSupported}
            onClick={capture.startRecording}
            className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-border-strong bg-background-subtle px-5 text-action font-medium text-foreground hover:border-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className="h-2.25 w-2.25 rounded-full bg-danger"
            />
            {copy.voice.start}
          </button>
          <span className="font-mono text-meta uppercase text-foreground-tertiary">
            {copy.voice.maxDuration}
          </span>
        </>
      )}
      {voice.status === "recording" && (
        <>
          <span
            role="timer"
            aria-live="off"
            className="font-mono text-heading-md tabular-nums text-foreground"
          >
            {formatted}
          </span>
          <span className="flex items-center gap-2 text-caption text-foreground-secondary">
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-danger"
            />
            {copy.voice.micActive}
          </span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={capture.stopRecording}
              className={buttonClass("primary")}
            >
              {copy.voice.stop}
            </button>
            <button
              type="button"
              onClick={capture.cancelRecording}
              className={buttonClass("ghost")}
            >
              {copy.voice.cancel}
            </button>
          </div>
        </>
      )}
      {voice.status === "done" && voice.blob && (
        <>
          <div className="flex w-full items-center gap-3 rounded-md border border-border bg-background-subtle px-3.5 py-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-background text-primary">
              <AppIcon icon={Mic} size={15} strokeWidth={1.5} decorative />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-caption font-medium text-foreground">
                {copy.voice.doneLabel}
              </b>
              <span className="font-mono text-meta text-foreground-tertiary">
                {formatted} · {copy.voice.recordedSuffix}
              </span>
            </span>
            <button
              type="button"
              onClick={capture.redoRecording}
              className="cursor-pointer text-caption text-foreground-tertiary hover:text-foreground"
            >
              {copy.voice.redo}
            </button>
          </div>
          <button
            type="button"
            disabled={!capture.canSubmit}
            onClick={capture.submit}
            className={buttonClass("primary")}
          >
            {copy.voice.submit}
          </button>
        </>
      )}
    </div>
  );
}

function ProcessingPane({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-background px-6 py-8 text-center">
      <RenyqoLoadingDots label={copy.processing.label} />
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer text-caption text-foreground-tertiary hover:text-foreground"
      >
        {copy.processing.cancel}
      </button>
    </div>
  );
}

type ChipTone = "found" | "gap" | "check";

const CHIP_TONE_CLASS: Record<ChipTone, string> = {
  found: "border-border bg-background text-foreground",
  gap: "border-dashed border-border-strong bg-transparent text-foreground-secondary",
  check: "border-border-strong bg-background text-foreground",
};
const CHIP_ICON: Record<ChipTone, LucideIcon> = {
  found: CheckCircle2,
  gap: CircleDashed,
  check: AlertTriangle,
};
const CHIP_ICON_CLASS: Record<ChipTone, string> = {
  found: "text-success",
  gap: "text-foreground-tertiary",
  check: "text-warning",
};

function ResultChipSection({
  label,
  hint,
  items,
  tone,
}: {
  label: string;
  hint?: string;
  items: readonly string[];
  tone: ChipTone;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-meta uppercase text-foreground-secondary">
          {label}
        </span>
        <span className="rounded-sm border border-border bg-background px-1.25 py-0.25 font-mono text-meta text-foreground-tertiary">
          {items.length}
        </span>
      </div>
      {hint && (
        <p className="mb-2 flex items-start gap-1.5 text-caption leading-normal text-foreground-secondary">
          <AppIcon
            icon={Info}
            size={13}
            strokeWidth={1.4}
            decorative
            className="mt-0.5 shrink-0 text-foreground-tertiary"
          />
          {hint}
        </p>
      )}
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption",
              CHIP_TONE_CLASS[tone],
            )}
          >
            <AppIcon
              icon={CHIP_ICON[tone]}
              size={12}
              strokeWidth={1.6}
              decorative
              className={CHIP_ICON_CLASS[tone]}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultPane({
  result,
  descriptors,
  onApply,
  onReset,
}: {
  result: ListingExtractionResult;
  descriptors: readonly ExtractionFieldDescriptor[];
  onApply: () => void;
  onReset: () => void;
}) {
  const foundLabels = descriptors.map((d) => d.label);
  const missingLabels = result.requiredMissingFields.map(mapMissingFieldLabel);
  const recommendedMissing =
    result.recommendedMissingFields.map(mapMissingFieldLabel);
  const checkLabels = Array.from(
    new Set(result.inconsistencies.map(mapInconsistencyLabel)),
  );
  const totalFound = foundLabels.length;

  return (
    <div>
      <div className="mb-1 flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border",
            missingLabels.length > 0
              ? "border-warning text-warning"
              : "border-success text-success",
          )}
        >
          <AppIcon
            icon={missingLabels.length > 0 ? AlertTriangle : Check}
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
            {missingLabels.length > 0
              ? missingLabels.length === 1
                ? copy.result.missingRequiredSingular
                : copy.result.missingRequiredPlural
              : copy.result.allRequiredComplete}
          </p>
        </div>
      </div>

      <ResultChipSection
        label={copy.result.foundLabel}
        items={foundLabels}
        tone="found"
      />
      <ResultChipSection
        label={copy.result.missingLabel}
        items={missingLabels}
        tone="gap"
      />
      <ResultChipSection
        label={copy.result.recommendedLabel}
        hint={copy.result.recommendedHint}
        items={recommendedMissing}
        tone="gap"
      />
      <ResultChipSection
        label={copy.result.checkLabel}
        hint={copy.result.checkHint}
        items={checkLabels}
        tone="check"
      />

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
          onClick={onReset}
          className={buttonClass("ghost")}
        >
          {copy.result.newInput}
        </button>
      </div>
    </div>
  );
}

function AppliedPane({
  appliedCount,
  onClose,
  onAddMore,
}: {
  appliedCount: number;
  onClose: () => void;
  onAddMore: () => void;
}) {
  return (
    <div>
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

const ERROR_TITLES: Record<AiCaptureErrorKind, string> = {
  invalid: copy.error.genericTitle,
  rateLimit: copy.error.rateLimitTitle,
  unauthorized: copy.error.unauthorizedTitle,
  network: copy.error.networkTitle,
  cancelled: copy.error.genericTitle,
  generic: copy.error.genericTitle,
};

function ErrorPane({
  kind,
  message,
  onRetry,
  onReset,
}: {
  kind: AiCaptureErrorKind | null;
  message: string | null;
  onRetry: () => void;
  onReset: () => void;
}) {
  const title = kind ? ERROR_TITLES[kind] : copy.error.genericTitle;
  const body = message ?? copy.error.genericBody;

  return (
    <div>
      <div className="flex items-start gap-3 rounded-md border border-border border-l-2 border-l-danger bg-background px-3.5 py-3">
        <AppIcon
          icon={AlertCircle}
          size={16}
          strokeWidth={1.5}
          decorative
          className="mt-0.5 shrink-0 text-danger"
        />
        <div>
          <p className="text-caption font-medium text-foreground">{title}</p>
          <p className="text-caption text-foreground-secondary">{body}</p>
        </div>
      </div>
      <div className="mt-3.5 flex gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className={buttonClass("primary")}
        >
          {copy.error.retry}
        </button>
        <button
          type="button"
          onClick={onReset}
          className={buttonClass("ghost")}
        >
          {copy.error.newInput}
        </button>
      </div>
    </div>
  );
}
