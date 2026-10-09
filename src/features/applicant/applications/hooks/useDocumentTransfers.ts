"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { isStateConflict } from "../api/errors";
import type { WorkspaceDocumentRequest } from "../api/workspace";
import {
  DOCUMENT_UPLOAD_MAX_BYTES,
  DOCUMENT_UPLOAD_MIME_TYPES,
  downloadDocumentContent,
  uploadRequestedDocument,
} from "../api/documents";

export type UploadFailure =
  | "type"
  | "size"
  | "empty"
  | "rejected"
  | "conflict"
  | "failed";

export interface DocumentTransfers {
  readonly bindInput: (element: HTMLInputElement | null) => void;
  readonly uploadingId: string | null;
  readonly isUploadBlocked: (requestId: string) => boolean;
  readonly canUpload: (requestId: string) => boolean;
  readonly uploadFailure: {
    readonly requestId: string;
    readonly reason: UploadFailure;
  } | null;
  readonly downloadingId: string | null;
  readonly downloadFailedId: string | null;
  readonly openPicker: (requestId: string) => void;
  readonly onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly download: (documentId: string) => void;
}

function validateDocumentFile(file: File): UploadFailure | null {
  if (!DOCUMENT_UPLOAD_MIME_TYPES.some((type) => type === file.type))
    return "type";
  if (file.size === 0) return "empty";
  if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) return "size";
  return null;
}

function uploadFailure(error: unknown): UploadFailure {
  if (isStateConflict(error)) return "conflict";
  if (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 413)
  )
    return "rejected";
  return "failed";
}

export function useDocumentTransfers(
  applicationId: string,
  onChanged: () => number,
  acceptedGeneration: number,
  requests: readonly WorkspaceDocumentRequest[],
): DocumentTransfers {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const targetRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const downloadBusyRef = useRef(false);
  const blockedRef = useRef<ReadonlyMap<string, number>>(new Map());
  const [blockedRequests, setBlockedRequests] = useState<
    ReadonlyMap<string, number>
  >(new Map());
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadFailureState, setUploadFailure] =
    useState<DocumentTransfers["uploadFailure"]>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadFailedId, setDownloadFailedId] = useState<string | null>(null);

  const canUpload = useCallback(
    (requestId: string) =>
      requests.find((request) => request.requestId === requestId)?.canUpload ===
      true,
    [requests],
  );

  const isUploadBlocked = useCallback(
    (requestId: string) => {
      const required = blockedRequests.get(requestId);
      return required !== undefined && acceptedGeneration < required;
    },
    [acceptedGeneration, blockedRequests],
  );

  const synchronize = useCallback(
    (requestId: string) => {
      const required = onChanged();
      const next = new Map(blockedRef.current);
      next.set(requestId, required);
      blockedRef.current = next;
      setBlockedRequests(next);
    },
    [onChanged],
  );

  const bindInput = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
  }, []);

  const openPicker = useCallback(
    (requestId: string) => {
      const required = blockedRef.current.get(requestId);
      if (
        busyRef.current ||
        !canUpload(requestId) ||
        (required !== undefined && acceptedGeneration < required)
      )
        return;
      targetRef.current = requestId;
      inputRef.current?.click();
    },
    [acceptedGeneration, canUpload],
  );

  const upload = useCallback(
    async (requestId: string, file: File) => {
      const required = blockedRef.current.get(requestId);
      if (
        busyRef.current ||
        !canUpload(requestId) ||
        (required !== undefined && acceptedGeneration < required)
      )
        return;
      const invalid = validateDocumentFile(file);
      if (invalid) {
        setUploadFailure({ requestId, reason: invalid });
        return;
      }
      busyRef.current = true;
      setUploadingId(requestId);
      setUploadFailure(null);
      try {
        await uploadRequestedDocument(applicationId, requestId, file);
        synchronize(requestId);
      } catch (error) {
        const reason = uploadFailure(error);
        setUploadFailure({ requestId, reason });
        if (reason === "conflict") synchronize(requestId);
      } finally {
        busyRef.current = false;
        setUploadingId(null);
      }
    },
    [applicationId, acceptedGeneration, canUpload, synchronize],
  );

  const onFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      const requestId = targetRef.current;
      event.target.value = "";
      targetRef.current = null;
      if (!file || !requestId || busyRef.current) return;
      void upload(requestId, file);
    },
    [upload],
  );

  const download = useCallback(
    (documentId: string) => {
      if (downloadBusyRef.current) return;
      downloadBusyRef.current = true;
      setDownloadingId(documentId);
      setDownloadFailedId(null);
      downloadDocumentContent(applicationId, documentId)
        .catch(() => setDownloadFailedId(documentId))
        .finally(() => {
          downloadBusyRef.current = false;
          setDownloadingId(null);
        });
    },
    [applicationId],
  );

  return {
    bindInput,
    uploadingId,
    isUploadBlocked,
    canUpload,
    uploadFailure: uploadFailureState,
    downloadingId,
    downloadFailedId,
    openPicker,
    onFileSelected,
    download,
  };
}
