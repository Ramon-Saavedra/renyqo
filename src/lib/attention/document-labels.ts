import type { ApplicationDocumentType } from "./types";

const DOCUMENT_TYPE_LABEL: Record<ApplicationDocumentType, string> = {
  SCHUFA: "SCHUFA",
  INCOME_PROOF: "Einkommensnachweis",
  IDENTITY_DOCUMENT: "Identitätsnachweis",
  LIABILITY_INSURANCE: "Haftpflichtversicherung",
  OTHER: "Sonstiges",
};

export function documentAttentionTypeLabel(
  type: ApplicationDocumentType,
  customLabel: string | null,
): string {
  const custom = customLabel?.trim();
  if (type === "OTHER" && custom) return custom;
  return DOCUMENT_TYPE_LABEL[type];
}
