import { uploadListingImage } from "@/lib/api/listings";
import type { ListingDraft } from "./useListingDraft";

export interface ListingPhotoFile {
  readonly id: string;
  readonly file: File;
}

export function getListingPhotoFiles(
  draft: ListingDraft,
): readonly ListingPhotoFile[] {
  return draft.photos.flatMap((photo) =>
    photo.file ? [{ id: photo.id, file: photo.file }] : [],
  );
}

export async function uploadPendingListingImages(
  listingId: string,
  photoFiles: readonly ListingPhotoFile[],
  uploadedPhotoIds: Set<string>,
): Promise<void> {
  for (const photo of photoFiles) {
    if (!uploadedPhotoIds.has(photo.id)) {
      await uploadListingImage(listingId, photo.file);
      uploadedPhotoIds.add(photo.id);
    }
  }
}
