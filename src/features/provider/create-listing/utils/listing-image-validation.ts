export const MAX_LISTING_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export type ListingImageValidationError = "invalid-format" | "too-large";

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];

export function validateListingImageFile(
  file: File,
): ListingImageValidationError | null {
  if (!hasAllowedImageFormat(file)) return "invalid-format";
  if (file.size > MAX_LISTING_IMAGE_SIZE_BYTES) return "too-large";
  return null;
}

function hasAllowedImageFormat(file: File): boolean {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMimeType)) {
    return true;
  }
  if (file.type) return false;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension as AllowedImageExtension);
}
