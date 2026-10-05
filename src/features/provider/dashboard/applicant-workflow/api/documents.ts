import { z } from "zod";
import { apiGet, apiGetBlob, apiPatchVoid, apiPost } from "@/lib/api/client";
import {
  DOCUMENT_REQUEST_TYPES,
  normalizeCustomLabel,
  type DocumentRequestType,
} from "../document-labels";
import { WorkspaceContractError } from "./workspace";

const dateTimeSchema = z.string().datetime();

const documentFileSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  state: z.enum(["PROCESSING", "AVAILABLE", "FAILED"]),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  createdAt: dateTimeSchema,
  availableAt: dateTimeSchema.nullable(),
  reviewedAt: dateTimeSchema.nullable(),
  canDownload: z.boolean(),
  canReview: z.boolean(),
});

const documentRequestResponseSchema = z.object({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  type: z.enum(DOCUMENT_REQUEST_TYPES),
  customLabel: z.string().nullable(),
  round: z.number().int().positive(),
  requestedAt: dateTimeSchema,
  supersededAt: dateTimeSchema.nullable(),
  status: z.enum([
    "UPLOAD_REQUIRED",
    "PROCESSING",
    "RECEIVED",
    "REVIEWED",
    "SUPERSEDED",
  ]),
  canUpload: z.boolean(),
  canCancel: z.boolean(),
  canRequestReplacement: z.boolean(),
  documents: z.array(documentFileSchema),
});

export type DocumentRequestInput =
  | { readonly type: Exclude<DocumentRequestType, "OTHER"> }
  | { readonly type: "OTHER"; readonly customLabel: string };

export function documentRequestPayload(
  inputs: readonly DocumentRequestInput[],
): {
  requests: readonly { type: DocumentRequestType; customLabel?: string }[];
} {
  return {
    requests: inputs.map((input) => {
      if (input.type !== "OTHER") return { type: input.type };
      const customLabel = normalizeCustomLabel(input.customLabel);
      if (!customLabel) throw new WorkspaceContractError();
      return { type: "OTHER" as const, customLabel };
    }),
  };
}

export async function createDocumentRequests(
  applicationId: string,
  inputs: readonly DocumentRequestInput[],
): Promise<void> {
  const response = await apiPost<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/document-requests`,
    documentRequestPayload(inputs),
  );
  const parsed = z.array(documentRequestResponseSchema).safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
}

export async function requestDocumentReplacement(
  applicationId: string,
  requestId: string,
): Promise<void> {
  const response = await apiPost<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/document-requests/${encodeURIComponent(requestId)}/replacements`,
    {},
  );
  const parsed = documentRequestResponseSchema.safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
}

export async function listDocumentRequests(
  applicationId: string,
): Promise<readonly { readonly id: string; readonly round: number }[]> {
  const response = await apiGet<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/document-requests`,
  );
  const parsed = z.array(documentRequestResponseSchema).safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
  return parsed.data.map((request) => ({
    id: request.id,
    round: request.round,
  }));
}

export async function cancelDocumentRequest(
  applicationId: string,
  requestId: string,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/document-requests/${encodeURIComponent(requestId)}/cancel`,
  );
}

export async function reviewDocument(
  applicationId: string,
  documentId: string,
): Promise<void> {
  const response = await apiPost<unknown>(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/review`,
    { status: "REVIEWED" },
  );
  const parsed = documentFileSchema.safeParse(response);
  if (!parsed.success) throw new WorkspaceContractError();
}

export async function openDocumentContent(
  applicationId: string,
  documentId: string,
): Promise<void> {
  const blob = await apiGetBlob(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/content`,
  );
  const url = URL.createObjectURL(
    new Blob([blob], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "Unterlage";
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
