import { apiPatchVoid } from "@/lib/api/client";

export async function restoreProviderApplication(
  applicationId: string,
): Promise<void> {
  await apiPatchVoid(
    `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/restore`,
  );
}
