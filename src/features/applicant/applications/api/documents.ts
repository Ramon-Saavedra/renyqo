import { z } from "zod";
import {
  apiGet,
  apiGetBlobResponse,
  apiPostFormData,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { ApplicantApplicationContractError } from "./errors";
import { DOCUMENT_TYPES, dateTimeSchema } from "./shared-schemas";
import { downloadMetadata } from "../model/download-metadata";
import type { WorkspaceDocumentRequest } from "./workspace";

export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export const DOCUMENT_UPLOAD_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const UPLOAD_TIMEOUT_MS = 120_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const REVOKE_DELAY_MS = 60_000;

const documentFileSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  state: z.enum(["PROCESSING", "AVAILABLE", "FAILED"]),
  createdAt: dateTimeSchema,
  availableAt: dateTimeSchema.nullable(),
  reviewedAt: dateTimeSchema.nullable(),
});

const documentRequestSchema = z.object({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  type: z.enum(DOCUMENT_TYPES),
  requestedAt: dateTimeSchema,
  supersededAt: dateTimeSchema.nullable(),
  documents: z.array(documentFileSchema),
});

export interface DocumentRequestTimeline {
  readonly requestedAt: string;
  readonly uploadedAt: string | null;
  readonly reviewedAt: string | null;
}

function documentsPath(applicationId: string): string {
  return `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}`;
}

export async function getDocumentRequestTimelines(
  applicationId: string,
  requests: readonly WorkspaceDocumentRequest[],
  options?: ApiRequestOptions,
): Promise<ReadonlyMap<string, DocumentRequestTimeline>> {
  const response = await apiGet<unknown>(
    `${documentsPath(applicationId)}/document-requests`,
    options,
  );
  const parsed = z.array(documentRequestSchema).safeParse(response);
  if (
    !parsed.success ||
    parsed.data.some((request) => request.applicationId !== applicationId)
  ) {
    throw new ApplicantApplicationContractError();
  }
  return new Map(
    requests.map((request) => {
      const history = parsed.data.find((item) => item.id === request.requestId);
      if (!history) throw new ApplicantApplicationContractError();
      const current =
        request.documentId === null
          ? null
          : history.documents.find(
              (document) => document.id === request.documentId,
            );
      if (request.documentId !== null && !current)
        throw new ApplicantApplicationContractError();
      return [
        request.requestId,
        {
          requestedAt: history.requestedAt,
          uploadedAt: current?.createdAt ?? null,
          reviewedAt: current?.reviewedAt ?? null,
        },
      ];
    }),
  );
}

export async function uploadRequestedDocument(
  applicationId: string,
  requestId: string,
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  const response = await apiPostFormData<unknown>(
    `${documentsPath(applicationId)}/document-requests/${encodeURIComponent(requestId)}/document`,
    body,
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
  const parsed = documentFileSchema.safeParse(response);
  if (!parsed.success || parsed.data.requestId !== requestId) {
    throw new ApplicantApplicationContractError();
  }
}

export async function downloadDocumentContent(
  applicationId: string,
  documentId: string,
): Promise<void> {
  const response = await apiGetBlobResponse(
    `${documentsPath(applicationId)}/documents/${encodeURIComponent(documentId)}/content`,
    { timeoutMs: DOWNLOAD_TIMEOUT_MS },
  );
  const metadata = downloadMetadata(
    response.blob.type,
    response.contentDisposition,
  );
  const url = URL.createObjectURL(
    new Blob([response.blob], { type: metadata.mimeType }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = metadata.filename;
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}
