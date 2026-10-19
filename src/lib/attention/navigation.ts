import type { ApplicantListingAttention } from "./types";
import { hasApplicationAttentionSurface } from "./visibility";

export function listingHref(listingId: string): string {
  return `/listings/${encodeURIComponent(listingId)}`;
}

export function applicationWorkspaceHref(applicationId: string): string {
  return `/applicant/applications/${encodeURIComponent(applicationId)}`;
}

export function listingAttentionHref(
  attention: ApplicantListingAttention | null,
): string | null {
  if (!attention || !hasApplicationAttentionSurface(attention)) return null;
  return applicationWorkspaceHref(attention.applicationId);
}
