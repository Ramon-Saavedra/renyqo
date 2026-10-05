import { apiPatchJsonVoid } from "@/lib/api/client";

export async function selectApplicationForRental(
  listingId: string,
  applicationId: string,
): Promise<void> {
  await apiPatchJsonVoid(
    `/api/v1/provider/listings/${encodeURIComponent(listingId)}/rent`,
    { selectedApplicationId: applicationId },
  );
}
