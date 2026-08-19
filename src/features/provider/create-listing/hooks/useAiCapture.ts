"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  extractListingFromAudio,
  extractListingFromPdf,
  extractListingFromText,
  type ListingExtractionResult,
} from "@/lib/api/listing-assistance";
import { createListingCopy } from "../copy/create-listing";
import {
  applyExtractionResult,
  buildExtractionFieldDescriptors,
  type ExtractionFieldDescriptor,
} from "./listingExtractionMapping";
import type { ListingDraft } from "./useListingDraft";
import {
  aiCaptureErrorMessage,
  classifyAiCaptureError,
} from "./aiCaptureErrors";

export type AiCaptureMode = "pdf" | "text" | "voice";
export type AiCaptureStage =
  | "input"
  | "processing"
  | "result"
  | "applied"
  | "error";
export type AiCaptureErrorKind =
  | "invalid"
  | "rateLimit"
  | "unauthorized"
  | "network"
  | "cancelled"
  | "generic";

export type SetDraftField = <K extends keyof ListingDraft>(
  field: K,
  value: ListingDraft[K],
) => void;

interface PdfState {
  readonly file: File | null;
  readonly error: string | null;
}

type VoiceStatus = "idle" | "recording" | "done";

interface VoiceState {
  readonly status: VoiceStatus;
  readonly seconds: number;
  readonly blob: Blob | null;
  readonly error: string | null;
}

const PDF_MAX_BYTES = 10 * 1024 * 1024;
const RECORDING_MAX_SECONDS = 180;
const TEXT_MAX_LENGTH = 20000;
const TEXT_MIN_LENGTH = 20;

const copy = createListingCopy.aiCapture;

const AUDIO_MIME_CANDIDATES = ["audio/webm", "audio/mp4"] as const;

function pickSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return AUDIO_MIME_CANDIDATES.find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

export function normalizeAudioMimeType(type: string): string | null {
  const base = type.split(";")[0]?.trim().toLowerCase();
  const isKnown = (AUDIO_MIME_CANDIDATES as readonly string[]).includes(
    base ?? "",
  );
  return isKnown ? (base as string) : null;
}

function audioFileNameFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "aufnahme.m4a";
  return "aufnahme.webm";
}

function isVoiceCaptureSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function subscribeToVoiceSupport(): () => void {
  return () => {};
}

function getVoiceSupportServerSnapshot(): boolean {
  return false;
}

export interface UseAiCaptureResult {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly mode: AiCaptureMode;
  readonly setMode: (mode: AiCaptureMode) => void;
  readonly stage: AiCaptureStage;
  readonly guideOpen: boolean;
  readonly toggleGuide: () => void;
  readonly pdf: PdfState;
  readonly pickPdfFile: (file: File) => void;
  readonly removePdfFile: () => void;
  readonly text: string;
  readonly setText: (value: string) => void;
  readonly voice: VoiceState;
  readonly voiceSupported: boolean;
  readonly startRecording: () => void;
  readonly stopRecording: () => void;
  readonly cancelRecording: () => void;
  readonly redoRecording: () => void;
  readonly canSubmit: boolean;
  readonly submit: () => void;
  readonly cancelProcessing: () => void;
  readonly result: ListingExtractionResult | null;
  readonly descriptors: readonly ExtractionFieldDescriptor[];
  readonly errorKind: AiCaptureErrorKind | null;
  readonly errorMessage: string | null;
  readonly retry: () => void;
  readonly reset: () => void;
  readonly apply: () => void;
  readonly appliedCount: number;
}

export function useAiCapture(setField: SetDraftField): UseAiCaptureResult {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setModeState] = useState<AiCaptureMode>("pdf");
  const [stage, setStage] = useState<AiCaptureStage>("input");
  const [guideOpen, setGuideOpen] = useState(true);
  const [pdf, setPdf] = useState<PdfState>({ file: null, error: null });
  const [text, setTextState] = useState("");
  const [voice, setVoice] = useState<VoiceState>({
    status: "idle",
    seconds: 0,
    blob: null,
    error: null,
  });
  const [result, setResult] = useState<ListingExtractionResult | null>(null);
  const [descriptors, setDescriptors] = useState<
    readonly ExtractionFieldDescriptor[]
  >([]);
  const [errorKind, setErrorKind] = useState<AiCaptureErrorKind | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const voiceSupported = useSyncExternalStore(
    subscribeToVoiceSupport,
    isVoiceCaptureSupported,
    getVoiceSupportServerSnapshot,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const recordingRequestRef = useRef(0);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const finishRecording = useCallback(
    (discard: boolean) => {
      discardRecordingRef.current = discard;
      clearRecordingTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    },
    [clearRecordingTimer],
  );

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      clearRecordingTimer();
      stopMediaStream();
    },
    [clearRecordingTimer, stopMediaStream],
  );

  const resetInputs = useCallback(() => {
    setStage("input");
    setPdf({ file: null, error: null });
    setTextState("");
    setVoice({ status: "idle", seconds: 0, blob: null, error: null });
    setResult(null);
    setDescriptors([]);
    setErrorKind(null);
    setAppliedCount(0);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    recordingRequestRef.current += 1;
    abortControllerRef.current?.abort();
    finishRecording(true);
    stopMediaStream();
    resetInputs();
    setIsOpen(false);
  }, [finishRecording, resetInputs, stopMediaStream]);

  const setMode = useCallback((next: AiCaptureMode) => {
    setModeState(next);
  }, []);

  const toggleGuide = useCallback(() => setGuideOpen((prev) => !prev), []);

  const pickPdfFile = useCallback((file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setPdf({ file: null, error: copy.pdf.errors.invalidType });
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      setPdf({ file: null, error: copy.pdf.errors.tooLarge });
      return;
    }
    setPdf({ file, error: null });
  }, []);

  const removePdfFile = useCallback(() => {
    setPdf({ file: null, error: null });
  }, []);

  const setText = useCallback((value: string) => {
    setTextState(value.slice(0, TEXT_MAX_LENGTH));
  }, []);

  const startRecording = useCallback(() => {
    if (!isVoiceCaptureSupported()) {
      setVoice((prev) => ({ ...prev, error: copy.voice.unsupported }));
      return;
    }

    const requestId = recordingRequestRef.current + 1;
    recordingRequestRef.current = requestId;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (recordingRequestRef.current !== requestId) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const mimeType = pickSupportedAudioMimeType();
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (discardRecordingRef.current) {
            setVoice({ status: "idle", seconds: 0, blob: null, error: null });
            return;
          }
          const normalizedType = normalizeAudioMimeType(
            recorder.mimeType || mimeType || "",
          );
          if (!normalizedType) {
            setVoice({
              status: "idle",
              seconds: 0,
              blob: null,
              error: copy.voice.formatUnsupported,
            });
            return;
          }
          const blob = new Blob(chunks, { type: normalizedType });
          setVoice((prev) => ({ ...prev, status: "done", blob }));
        };
        recorderRef.current = recorder;
        discardRecordingRef.current = false;
        recorder.start();
        setVoice({ status: "recording", seconds: 0, blob: null, error: null });
        recordingTimerRef.current = window.setInterval(() => {
          setVoice((prev) => {
            const seconds = prev.seconds + 1;
            if (seconds >= RECORDING_MAX_SECONDS) {
              finishRecording(false);
            }
            return { ...prev, seconds };
          });
        }, 1000);
      })
      .catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : "";
        const message =
          name === "NotAllowedError"
            ? copy.voice.permissionDenied
            : copy.voice.unsupported;
        setVoice((prev) => ({ ...prev, error: message }));
      });
  }, [finishRecording]);

  const stopRecording = useCallback(
    () => finishRecording(false),
    [finishRecording],
  );
  const cancelRecording = useCallback(() => {
    recordingRequestRef.current += 1;
    finishRecording(true);
  }, [finishRecording]);
  const redoRecording = useCallback(() => {
    setVoice({ status: "idle", seconds: 0, blob: null, error: null });
  }, []);

  const canSubmit =
    stage === "input" &&
    ((mode === "pdf" && pdf.file !== null && pdf.error === null) ||
      (mode === "text" && text.trim().length >= TEXT_MIN_LENGTH) ||
      (mode === "voice" && voice.status === "done" && voice.blob !== null));

  const handleError = useCallback((err: unknown) => {
    const kind = classifyAiCaptureError(err);
    if (kind === "cancelled") {
      setStage("input");
      return;
    }
    setErrorKind(kind);
    setStage("error");
  }, []);

  const runExtraction = useCallback(
    (task: (signal: AbortSignal) => Promise<ListingExtractionResult>) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setStage("processing");
      task(controller.signal)
        .then((response) => {
          setResult(response);
          setDescriptors(buildExtractionFieldDescriptors(response.values));
          setStage("result");
        })
        .catch(handleError)
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        });
    },
    [handleError],
  );

  const submit = useCallback(() => {
    if (!canSubmit) return;

    if (mode === "pdf" && pdf.file) {
      const file = pdf.file;
      runExtraction((signal) => extractListingFromPdf(file, { signal }));
      return;
    }
    if (mode === "text") {
      const value = text.trim();
      runExtraction((signal) => extractListingFromText(value, { signal }));
      return;
    }
    if (mode === "voice" && voice.blob) {
      const mimeType = voice.blob.type;
      const file = new File([voice.blob], audioFileNameFor(mimeType), {
        type: mimeType,
      });
      runExtraction((signal) => extractListingFromAudio(file, { signal }));
    }
  }, [canSubmit, mode, pdf.file, runExtraction, text, voice.blob]);

  const cancelProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStage("input");
  }, []);

  const retry = useCallback(() => {
    setErrorKind(null);
    setStage("input");
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    resetInputs();
  }, [resetInputs]);

  const apply = useCallback(() => {
    if (!result) return;
    applyExtractionResult(result.values, descriptors, setField);
    setAppliedCount(descriptors.length);
    setStage("applied");
  }, [descriptors, result, setField]);

  return {
    isOpen,
    open,
    close,
    mode,
    setMode,
    stage,
    guideOpen,
    toggleGuide,
    pdf,
    pickPdfFile,
    removePdfFile,
    text,
    setText,
    voice,
    voiceSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    redoRecording,
    canSubmit,
    submit,
    cancelProcessing,
    result,
    descriptors,
    errorKind,
    errorMessage: errorKind ? aiCaptureErrorMessage(errorKind, mode) : null,
    retry,
    reset,
    apply,
    appliedCount,
  };
}
