const SAFE_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function safeFilename(value: string): string | null {
  if (
    !value ||
    value.length > 200 ||
    /[\\/<>:"|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)
  )
    return null;
  if (value === "." || value === ".." || /[. ]$/u.test(value)) return null;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(value)) return null;
  return value;
}

export function downloadMetadata(
  mimeType: string,
  disposition: string | null,
): {
  readonly mimeType: string;
  readonly filename: string;
} {
  const safeMime = SAFE_MIME_TYPES.has(mimeType)
    ? mimeType
    : "application/octet-stream";
  let filename: string | null = null;
  if (safeMime !== "application/octet-stream" && disposition) {
    const encoded = /(?:^|;)\s*filename\*=UTF-8''([^;]+)/iu.exec(
      disposition,
    )?.[1];
    if (encoded) {
      try {
        filename = safeFilename(decodeURIComponent(encoded.trim()));
      } catch {
        filename = null;
      }
    } else {
      const plain = /(?:^|;)\s*filename=(?:"([^"\r\n]*)"|([^;\r\n]*))/iu.exec(
        disposition,
      );
      filename = safeFilename((plain?.[1] ?? plain?.[2] ?? "").trim());
    }
  }
  const extension = filename?.split(".").at(-1)?.toLowerCase();
  const matchesMime =
    safeMime === "application/pdf"
      ? extension === "pdf"
      : safeMime === "image/png"
        ? extension === "png"
        : safeMime === "image/jpeg" &&
          (extension === "jpg" || extension === "jpeg");
  if (!matchesMime) filename = null;
  return { mimeType: safeMime, filename: filename ?? "Unterlage" };
}
