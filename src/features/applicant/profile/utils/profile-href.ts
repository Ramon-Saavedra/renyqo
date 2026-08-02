import { safeListingsReturnTo } from "@/lib/utils/safe-redirect";

export const APPLICANT_PROFILE_PATH = "/applicant/profile";

export function buildProfileHref(returnTo: string | null | undefined): string {
  const target = safeListingsReturnTo(returnTo);
  return `${APPLICANT_PROFILE_PATH}?returnTo=${encodeURIComponent(target)}`;
}
