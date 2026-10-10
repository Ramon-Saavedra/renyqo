import type { LucideIcon } from "lucide-react";
import { FileText, IdCard, ShieldCheck, Umbrella, Wallet } from "lucide-react";
import type { DocumentType } from "../api/shared-schemas";
import { applicationsCopy } from "../copy";

const DOCUMENT_ICON: Record<DocumentType, LucideIcon> = {
  SCHUFA: ShieldCheck,
  INCOME_PROOF: Wallet,
  IDENTITY_DOCUMENT: IdCard,
  LIABILITY_INSURANCE: Umbrella,
  OTHER: FileText,
};

export function documentLabel(
  type: DocumentType,
  customLabel: string | null,
): string {
  const custom = customLabel?.trim();
  if (type === "OTHER" && custom) return custom;
  return applicationsCopy.documents.labels[type];
}

export function documentIcon(type: DocumentType): LucideIcon {
  return DOCUMENT_ICON[type];
}
