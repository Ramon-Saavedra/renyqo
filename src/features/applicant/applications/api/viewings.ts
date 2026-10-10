import { z } from "zod";
import {
  apiGet,
  apiPatchJsonVoid,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { ApplicantApplicationContractError } from "./errors";
import type { ViewingInterest } from "./shared-schemas";

export const VIEWING_CHANGE_MESSAGE_MAX_LENGTH = 500;

const viewingDetailSchema = z.object({
  viewingId: z.string().min(1),
  applicationId: z.string().min(1),
  providerNote: z.string().nullable(),
  changeRequestMessage: z.string().nullable(),
});

export type ViewingDetail = z.infer<typeof viewingDetailSchema>;

function viewingPath(applicationId: string, viewingId: string): string {
  return `/api/v1/applicant/applications/${encodeURIComponent(applicationId)}/viewings/${encodeURIComponent(viewingId)}`;
}

export async function getViewingDetail(
  applicationId: string,
  viewingId: string,
  options?: ApiRequestOptions,
): Promise<ViewingDetail> {
  const response = await apiGet<unknown>(
    viewingPath(applicationId, viewingId),
    options,
  );
  const parsed = viewingDetailSchema.safeParse(response);
  if (
    !parsed.success ||
    parsed.data.viewingId !== viewingId ||
    parsed.data.applicationId !== applicationId
  ) {
    throw new ApplicantApplicationContractError();
  }
  return parsed.data;
}

export function acceptViewing(
  applicationId: string,
  viewingId: string,
): Promise<void> {
  return apiPatchJsonVoid(
    `${viewingPath(applicationId, viewingId)}/accept`,
    {},
  );
}

export function declineViewing(
  applicationId: string,
  viewingId: string,
): Promise<void> {
  return apiPatchJsonVoid(
    `${viewingPath(applicationId, viewingId)}/decline`,
    {},
  );
}

export function requestAnotherViewingTime(
  applicationId: string,
  viewingId: string,
  message: string,
): Promise<void> {
  const trimmed = message.trim();
  return apiPatchJsonVoid(
    `${viewingPath(applicationId, viewingId)}/request-another-time`,
    trimmed ? { message: trimmed } : {},
  );
}

export function submitViewingInterest(
  applicationId: string,
  viewingId: string,
  interest: ViewingInterest,
): Promise<void> {
  return apiPatchJsonVoid(`${viewingPath(applicationId, viewingId)}/interest`, {
    interest,
  });
}
