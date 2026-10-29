const NOTIFICATION_LABELS: Record<string, string> = {
  VIEWING_PROPOSED: "Neuer Terminvorschlag",
  VIEWING_ACCEPTED: "Termin bestätigt",
  VIEWING_DECLINED: "Terminvorschlag abgelehnt",
  VIEWING_CHANGE_REQUESTED: "Andere Zeit vorgeschlagen",
  VIEWING_REPLACEMENT_PROPOSED: "Ersatztermin vorgeschlagen",
  VIEWING_PROPOSAL_WITHDRAWN: "Terminvorschlag zurückgezogen",
  VIEWING_CANCELLED: "Termin abgesagt",
  VIEWING_COMPLETED: "Besichtigung abgeschlossen",
  VIEWING_NO_SHOW: "Besichtigung nicht wahrgenommen",
  VIEWING_OUTCOME_CORRECTED: "Besichtigungsergebnis korrigiert",
  VIEWING_INTEREST_CONFIRMED: "Interesse bestätigt",
  VIEWING_PROPOSAL_EXPIRED: "Terminvorschlag abgelaufen",
  APPLICATION_REJECTED: "Bewerbung abgelehnt",
  APPLICATION_RESTORED: "Bewerbung wieder aufgenommen",
  APPLICATION_WITHDRAWN: "Bewerbung zurückgezogen",
  APPLICATION_ACCEPTED: "Bewerbung angenommen",
  APPLICATION_PROMOTED_TO_ACTIVE: "Bewerbung ist aktiv",
  VIEWING_CONSIDERATION_CHANGED: "Bewerbung wird weiter geprüft",
  VIEWING_WORKFLOW_CLOSED: "Besichtigung beendet",
};

const FALLBACK_LABEL = "Neue Benachrichtigung";

export function notificationLabel(type: string): string {
  return NOTIFICATION_LABELS[type] ?? FALLBACK_LABEL;
}
