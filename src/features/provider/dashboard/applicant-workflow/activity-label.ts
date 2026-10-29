import { SHARED_ACTIVITY_EVENT_LABEL } from "@/lib/activity/event-labels";
import type { WorkspaceActivityItem } from "./api/workspace";
import { documentTypeLabel } from "./document-labels";
import { formatWorkflowTimestamp } from "./format-timestamp";

const EVENT_LABEL: Record<WorkspaceActivityItem["type"], string> = {
  ...SHARED_ACTIVITY_EVENT_LABEL,
  VIEWING_CHANGE_REQUESTED: "Terminänderung angefragt",
  VIEWING_RESCHEDULED: "Besichtigung verschoben",
  VIEWING_COMPLETED: "Besichtigung durchgeführt",
  VIEWING_NO_SHOW: "Nicht erschienen",
  VIEWING_OUTCOME_CORRECTED: "Besichtigungsergebnis korrigiert",
  VIEWING_INTEREST_CONFIRMED: "Interesse bestätigt",
  VIEWING_INTEREST_DECLINED: "Interesse zurückgezogen",
  APPLICATION_PROMOTED_TO_ACTIVE: "Bewerbung aktiv geworden",
  APPLICATION_REJECTED: "Bewerbung abgelehnt",
  APPLICATION_RESTORED: "Bewerbung wiederhergestellt",
  APPLICATION_ACCEPTED: "Als Mieter ausgewählt",
  MESSAGE_SENT: "Nachricht gesendet",
  DOCUMENT_REQUESTED: "Unterlage angefordert",
  DOCUMENT_REQUEST_CANCELLED: "Anfrage entfernt",
  DOCUMENT_UPLOADED: "Unterlage hochgeladen",
  DOCUMENT_REVIEWED: "Unterlage geprüft",
};

function actorLabel(
  actorType: WorkspaceActivityItem["actorType"],
  applicantName: string,
): string {
  if (actorType === "PROVIDER") return "Du";
  if (actorType === "APPLICANT") return applicantName;
  return "System";
}

function eventLabel(
  item: WorkspaceActivityItem,
  documentRound?: number,
): string {
  if (
    item.type === "DOCUMENT_REQUESTED" ||
    item.type === "DOCUMENT_UPLOADED" ||
    item.type === "DOCUMENT_REVIEWED"
  ) {
    const name = documentTypeLabel(item.payload?.documentType ?? "", null);
    if (item.type === "DOCUMENT_REQUESTED") {
      return documentRound !== undefined && documentRound > 1
        ? `${name} erneut angefordert`
        : `${name} angefordert`;
    }
    if (item.type === "DOCUMENT_UPLOADED") return `${name} hochgeladen`;
    return `${name} geprüft`;
  }
  if (item.type === "MESSAGE_SENT" && item.actorType === "APPLICANT") {
    return "Antwort eingegangen";
  }
  return EVENT_LABEL[item.type];
}

export function formatActivityEntry(
  item: WorkspaceActivityItem,
  applicantName: string,
  documentRound?: number,
): { readonly text: string; readonly dateLabel: string } | null {
  if (item.type === "CONVERSATION_OPENED") return null;
  return {
    text: `${actorLabel(item.actorType, applicantName)} · ${eventLabel(item, documentRound)}`,
    dateLabel: formatWorkflowTimestamp(item.occurredAt),
  };
}
