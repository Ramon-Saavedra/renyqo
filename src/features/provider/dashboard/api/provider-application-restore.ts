import type { ApiRequestOptions } from "@/lib/api/client";
import { apiPatchVoid } from "@/lib/api/client";

export async function restoreProviderApplication(
  applicationId: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/restore`,
    providerOptions,
  );
}
