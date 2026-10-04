export const applicantWorkflowCopy = {
  context: "Bewerbung",
  close: "Schließen",
  expandIntroduction: "Mehr anzeigen",
  collapseIntroduction: "Weniger anzeigen",
  statusActive: "Aktiv",
  activeSince: (dateLabel: string) => `aktiv seit ${dateLabel}`,
  listingMeta: (rooms: string, area: string) => `${rooms} Zimmer · ${area}`,
  unavailableHint: "Derzeit nicht möglich",
  loadError: "Die Bewerbung konnte nicht geladen werden.",
  unavailableApplication: "Diese Bewerbung ist nicht mehr verfügbar.",
  contractError: "Die Bewerbung konnte nicht angezeigt werden.",
  retry: "Erneut versuchen",
  loading: "Bewerbung wird geladen",
  nextStep: {
    regionLabel: "Nächster Schritt",
    clearEyebrow: "Keine offene Aktion",
    clearTitle: "Aktuell ist nichts von dir zu tun.",
    pendingEyebrow: "Offene Aktion",
    pendingFallbackTitle: "Aktion erforderlich",
    pendingText: "Die nächste Aktion kommt aus dem aktuellen Stand der Bewerbung.",
  },
  summary: {
    messages: { label: "Nachrichten" },
    documents: { label: "Unterlagen" },
    viewing: { label: "Besichtigung" },
  },
  messages: {
    title: "Nachrichten",
    unavailableTitle: "Nachrichten noch nicht verfügbar",
    unavailableText: (name: string) =>
      `Nachrichten mit ${name} sind hier noch nicht verfügbar.`,
    firstMessage: "Erste Nachricht senden",
    composerLabel: (name: string) => `Nachricht an ${name}`,
    composerPlaceholder: "Erste Nachricht schreiben …",
    send: "Senden",
    sendError:
      "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.",
    loading: "Nachrichten werden geladen",
    loadError: "Nachrichten konnten nicht geladen werden.",
    empty: "Noch keine Nachrichten.",
    readOnly: "Nur lesen",
    waitingForYou: "Wartet auf deine Antwort.",
    waitingForApplicant: (name: string) =>
      `Wartet auf die Antwort von ${name}.`,
    sendBlockedUntilApplicant: (name: string) =>
      `Du kannst erst schreiben, wenn du eine Antwort von ${name} erhalten hast.`,
    conversationClosed: "Diese Unterhaltung ist geschlossen.",
    sendUnavailable: "Du kannst hier gerade keine Nachricht senden.",
    readOnlyText: (name: string) =>
      `Nachrichten mit ${name} können gelesen, aber nicht beantwortet werden.`,
    actorProvider: "Anbieter",
    actorApplicant: "Bewerber",
    actorSystem: "System",
  },
  documents: {
    title: "Unterlagen",
    unavailableText: (name: string) =>
      `Informationen zu den Unterlagen von ${name} sind hier noch nicht verfügbar.`,
    typesLabel: "Dokumente zum Anfordern",
    types: [
      "SCHUFA-Auskunft",
      "Einkommensnachweis",
      "Personalausweis",
      "Haftpflichtversicherung",
      "Sonstiges Dokument",
    ],
    request: "Unterlagen anfordern",
    empty: "Keine Unterlagen angefordert.",
    open: "Öffnen",
    review: "Als geprüft markieren",
    replace: "Ersatz anfordern",
    cancel: "Anfrage entfernen",
    cancelTitle: "Anfrage entfernen?",
    cancelText: (label: string) =>
      `${label} muss dann nicht mehr hochgeladen werden. Du kannst die Anfrage später erneut stellen.`,
    cancelConfirm: "Entfernen",
    cancelClose: "Dialog schließen",
    cancelPending: "Wird entfernt…",
    cancelDismiss: "Abbrechen",
    cancelError: "Die Anfrage konnte nicht entfernt werden.",
    requestMore: "Weitere Unterlagen anfordern",
    otherLabel: "Bezeichnung",
    otherInvalid: "Bitte eine kurze Bezeichnung ohne Sonderzeichen eingeben.",
    otherDuplicate: "Diese Bezeichnung ist bereits angefordert.",
    requestPending: "Wird angefordert…",
    requestError:
      "Die Unterlagen konnten nicht angefordert werden. Bitte versuche es erneut.",
    reviewError:
      "Die Unterlage konnte nicht als geprüft markiert werden. Bitte versuche es erneut.",
    replaceError:
      "Der Ersatz konnte nicht angefordert werden. Bitte versuche es erneut.",
    openError:
      "Die Unterlage konnte nicht geöffnet werden. Bitte versuche es erneut.",
  },
  viewing: {
    title: "Besichtigung",
    unavailableText: (name: string) =>
      `Informationen zu Besichtigungen mit ${name} sind hier noch nicht verfügbar.`,
    pickDate: "Datum wählen",
    pickTime: "Uhrzeit wählen",
    propose: "Termin vorschlagen",
    proposePending: "Wird vorgeschlagen…",
    proposeError:
      "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
    rescheduleError:
      "Der Termin konnte nicht verschoben werden. Bitte versuche es erneut.",
    cancelError:
      "Der Termin konnte nicht abgesagt werden. Bitte versuche es erneut.",
    completeError:
      "Das Ergebnis konnte nicht gespeichert werden. Bitte versuche es erneut.",
    noShowError:
      "Das Ergebnis konnte nicht gespeichert werden. Bitte versuche es erneut.",
    empty: "Kein Termin vorgeschlagen.",
    reschedule: "Verschieben",
    cancel: "Absagen",
    complete: "Durchgeführt",
    noShow: "Nicht erschienen",
  },
  activity: {
    title: "Verlauf",
    actorProvider: "Anbieter",
    actorApplicant: "Bewerber",
    actorSystem: "System",
    applicationActive: "Bewerbung aktiv geworden",
    empty: "Noch kein Verlauf.",
    showAll: "Alle anzeigen",
    showMore: "Weitere anzeigen",
    showLess: "Weniger anzeigen",
    loadError: "Der Verlauf konnte nicht geladen werden. Bitte versuche es erneut.",
    emptyHint: (name: string) =>
      `Weitere Informationen zum Verlauf der Bewerbung von ${name} sind hier noch nicht verfügbar.`,
  },
  decision: {
    title: "Entscheidung",
    reject: "Bewerbung ablehnen",
    selectTenant: "Als Mieter auswählen",
    selectUnavailable: "Die Auswahl als Mieter ist derzeit nicht möglich.",
    rejectUnavailable: "Ablehnen ist derzeit nicht möglich.",
    selectTitle: "Als Mieter auswählen?",
    selectText:
      "Diese Bewerbung wird angenommen. Das Objekt wird vermietet.",
    selectConfirm: "Auswählen",
    selectPending: "Wird ausgewählt…",
    selectCancel: "Abbrechen",
    selectError:
      "Die Auswahl konnte nicht gespeichert werden. Bitte versuche es erneut.",
  },
  tabs: {
    label: "Bereiche der Bewerbung",
    overview: "Übersicht",
    messages: "Chat",
    documents: "Unterlagen",
    viewing: "Termin",
  },
  openSection: "öffnen",
} as const;
