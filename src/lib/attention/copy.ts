export const attentionCopy = {
  pendingActions: (count: number) =>
    count === 1 ? "1 offener Schritt" : `${count} offene Schritte`,
  unreadMessages: (count: number) =>
    count === 1 ? "1 ungelesene Nachricht" : `${count} ungelesene Nachrichten`,
  documentUpload: (count: number) =>
    count === 1 ? "1 Dokument offen" : `${count} Dokumente offen`,
  documentUploadRequired: (documentLabel: string) =>
    `${documentLabel} erforderlich`,
  documentReview: (count: number) =>
    count === 1 ? "1 Dokument prüfen" : `${count} Dokumente prüfen`,
  viewingAction: (count: number) =>
    count === 1 ? "1 Besichtigung offen" : `${count} Besichtigungen offen`,
  attentionBadge: "Aufmerksamkeit erforderlich",
  workspaceBackToListing: "Zum Inserat",
  globalMenuTitle: "Aufmerksamkeit",
  globalMenuEmpty: "Keine offenen Punkte",
  globalMenuLoadMore: "Weitere laden",
  globalMenuError: "Aufmerksamkeit konnte nicht geladen werden",
  /** Matches applicant overview when backend sends null listing title. */
  listingTitleFallback: "Inserat ohne Titel",
  globalMenuAriaLabel: (count: number) =>
    count === 1 ? "1 offener Punkt" : `${count} offene Punkte`,
  messagesMenuTitle: "Nachrichten",
  messagesMenuEmpty: "Keine ungelesenen Nachrichten",
  messagesMenuError: "Nachrichten konnten nicht geladen werden",
} as const;
