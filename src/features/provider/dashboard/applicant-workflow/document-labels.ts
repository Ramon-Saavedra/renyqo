export const DOCUMENT_REQUEST_TYPES = [
  "SCHUFA",
  "INCOME_PROOF",
  "IDENTITY_DOCUMENT",
  "LIABILITY_INSURANCE",
  "OTHER",
] as const;

export type DocumentRequestType = (typeof DOCUMENT_REQUEST_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentRequestType, string> = {
  SCHUFA: "SCHUFA-Auskunft",
  INCOME_PROOF: "Einkommensnachweis",
  IDENTITY_DOCUMENT: "Personalausweis",
  LIABILITY_INSURANCE: "Privathaftpflichtversicherung",
  OTHER: "Sonstiges",
};

const CUSTOM_LABEL = /^[\p{L}\p{N} .,'()&+/-]+$/u;

export function normalizeCustomLabel(value: string): string | null {
  const label = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (label.length < 1 || label.length > 100 || !CUSTOM_LABEL.test(label)) {
    return null;
  }
  return label;
}

export function customLabelIdentity(value: string): string | null {
  const label = normalizeCustomLabel(value);
  if (!label) return null;
  return label.toLocaleLowerCase("de-DE");
}

export function availableDocumentTypes(
  current: readonly { type: string; customLabel: string | null }[],
): readonly DocumentRequestType[] {
  const active = new Set(
    current
      .filter((request) => request.type !== "OTHER")
      .map((request) => request.type),
  );
  return DOCUMENT_REQUEST_TYPES.filter(
    (type) => type === "OTHER" || !active.has(type),
  );
}

export function isActiveCustomLabel(
  current: readonly { type: string; customLabel: string | null }[],
  value: string,
): boolean {
  const identity = customLabelIdentity(value);
  if (!identity) return false;
  return current.some(
    (request) =>
      request.type === "OTHER" &&
      request.customLabel !== null &&
      customLabelIdentity(request.customLabel) === identity,
  );
}

export function documentTypeLabel(
  type: string,
  customLabel: string | null,
): string {
  const custom = customLabel?.trim();
  if (type === "OTHER" && custom) return custom;
  if (type in DOCUMENT_TYPE_LABEL) {
    return DOCUMENT_TYPE_LABEL[type as DocumentRequestType];
  }
  return "Unterlage";
}
