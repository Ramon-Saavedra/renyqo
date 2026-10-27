/** Event names that already use the same German wording for both audiences. */
export const SHARED_ACTIVITY_EVENT_LABEL = {
  APPLICATION_SUBMITTED: "Bewerbung eingereicht",
  APPLICATION_WITHDRAWN: "Bewerbung zurückgezogen",
  APPLICANT_REPLIES_ENABLED: "Antworten freigegeben",
  APPLICANT_REPLIES_DISABLED: "Antworten gesperrt",
  CONVERSATION_OPENED: "Unterhaltung begonnen",
  VIEWING_PROPOSED: "Besichtigung vorgeschlagen",
  VIEWING_ACCEPTED: "Besichtigung angenommen",
  VIEWING_DECLINED: "Besichtigung abgelehnt",
  VIEWING_CANCELLED: "Besichtigung abgesagt",
  VIEWING_REPLACEMENT_PROPOSED: "Ersatztermin vorgeschlagen",
  VIEWING_PROPOSAL_WITHDRAWN: "Terminvorschlag zurückgezogen",
  VIEWING_PROPOSAL_EXPIRED: "Terminvorschlag abgelaufen",
  VIEWING_INTEREST_EXPIRED: "Interesse abgelaufen",
  VIEWING_CONSIDERATION_CHANGED: "Prüfung aktualisiert",
  VIEWING_WORKFLOW_CLOSED: "Besichtigungsablauf geschlossen",
} as const;

export type SharedActivityEvent = keyof typeof SHARED_ACTIVITY_EVENT_LABEL;
