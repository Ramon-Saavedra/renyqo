export const LISTINGS_ROOT = "/listings";

function hasControlChars(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function hasTraversalSegment(path: string): boolean {
  return path.split("/").some((segment) => segment === ".." || segment === ".");
}

export function safeListingsReturnTo(value: string | null | undefined): string {
  if (!value) return LISTINGS_ROOT;
  if (!value.startsWith("/")) return LISTINGS_ROOT;
  if (value.startsWith("//")) return LISTINGS_ROOT;
  if (value.includes("\\")) return LISTINGS_ROOT;
  if (hasControlChars(value)) return LISTINGS_ROOT;

  const path = value.split(/[?#]/)[0] ?? "";
  if (hasTraversalSegment(path)) return LISTINGS_ROOT;
  if (path === LISTINGS_ROOT) return value;
  if (path.startsWith(`${LISTINGS_ROOT}/`)) return value;

  return LISTINGS_ROOT;
}
