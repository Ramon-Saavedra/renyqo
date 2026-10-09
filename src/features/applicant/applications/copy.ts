function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export const applicationsCopy = {
  overview: {
    title: "Meine Bewerbungen",
    summary: (total: number) =>
      `${total} ${plural(total, "Bewerbung", "Bewerbungen")}`,
    attention: (count: number) =>
      `${count} ${plural(count, "braucht", "brauchen")} deine Aufmerksamkeit`,
    filterLabel: "Bewerbungen filtern",
    filters: {
      ALL: "Alle",
      ACTIVE: "Aktiv",
      WAITING: "Warteliste",
      DONE: "Abgeschlossen",
    },
    loading: "Bewerbungen werden geladen",
    loadError: "Deine Bewerbungen konnten nicht geladen werden.",
    contractError: "Deine Bewerbungen konnten gerade nicht angezeigt werden.",
    retry: "Erneut versuchen",
    loadMore: "Weitere Bewerbungen laden",
    loadingMore: "Wird geladen …",
    loadMoreError: "Weitere Bewerbungen konnten nicht geladen werden.",
    emptyTitle: "Noch keine Bewerbungen",
    emptyText:
      "Sobald du dich auf eine Wohnung bewirbst, findest du sie hier mit allen nächsten Schritten.",
    emptyCta: "Wohnungen finden",
    emptyFilter: "In dieser Ansicht gibt es keine geladenen Bewerbungen.",
    untitledListing: "Inserat ohne Titel",
    noImage: "Kein Foto vorhanden",
    coldRent: (rent: string) => `${rent} kalt`,
    submittedAt: (date: string) => `Beworben am ${date}`,
    activeSince: (date: string) => `Aktiv seit ${date}`,
    activeFrom: (date: string) => `Aktiv ab ${date}`,
    pendingSteps: (count: number) =>
      `${count} ${plural(count, "offener Schritt", "offene Schritte")}`,
    unreadMessages: (count: number) =>
      `${count} ${plural(count, "neue Nachricht", "neue Nachrichten")}`,
    missingDocuments: (count: number) =>
      `${count} ${plural(count, "Unterlage fehlt", "Unterlagen fehlen")}`,
    statusPrefix: "Status",
  },
  status: {
    ACTIVE: "Aktiv",
    WAITING: "Warteliste",
    ACCEPTED: "Zusage",
    REJECTED: "Absage",
    WITHDRAWN: "Zurückgezogen",
  },
  overviewViewing: {
    PROPOSED: "Termin vorgeschlagen",
    ACCEPTED: "Besichtigung bestätigt",
    CHANGE_REQUESTED: "Andere Zeit angefragt",
    COMPLETED: "Besichtigung stattgefunden",
  },
  workspace: {
    back: "Meine Bewerbungen",
    eyebrow: "Meine Bewerbung",
    loading: "Bewerbung wird geladen",
    loadError: "Deine Bewerbung konnte nicht geladen werden.",
    contractError: "Deine Bewerbung konnte gerade nicht angezeigt werden.",
    notFoundTitle: "Bewerbung nicht gefunden",
    notFoundText:
      "Diese Bewerbung gibt es nicht oder sie gehört nicht zu deinem Konto.",
    retry: "Erneut versuchen",
    refreshError:
      "Der aktuelle Stand konnte nicht geladen werden. Angezeigt wird der letzte bekannte Stand.",
    statusLabel: "Status: ",
    submittedAt: "Beworben am",
    activeSince: "Aktiv seit",
    activeFrom: "Aktiv ab",
    rejectedAt: "Absage am",
    withdrawnAt: "Zurückgezogen am",
  },
  nextStep: {
    heading: "Dein nächster Schritt",
    count: (count: number) =>
      `${count} ${plural(count, "offener Schritt", "offene Schritte")}`,
    alsoOpen: "Ebenfalls offen",
    calmTitle: "Keine offene Aktion",
    calmText: "Aktuell ist nichts von dir zu tun.",
    calmViewing: (date: string, time: string) =>
      ` Deine Besichtigung ist am ${date} um ${time} Uhr.`,
    message: {
      title: "Nachricht beantworten",
      text: (date: string, time: string) =>
        `Der Anbieter hat dir am ${date} um ${time} Uhr geschrieben und wartet auf deine Antwort.`,
      fallbackText: "Der Anbieter wartet auf deine Antwort.",
      cta: "Zur Nachricht",
    },
    upload: {
      title: (label: string) => `${label} hochladen`,
      fallbackLabel: "Unterlage",
      text: (date: string) =>
        `Vom Anbieter angefordert am ${date}. Erlaubt sind PDF, JPEG und PNG.`,
      fallbackText: "Vom Anbieter angefordert. Erlaubt sind PDF, JPEG und PNG.",
      cta: "Datei hochladen",
    },
    viewing: {
      title: "Besichtigung bestätigen",
      text: (date: string, time: string) =>
        `Termin am ${date} um ${time} Uhr. Nimm ihn an, lehne ihn ab oder frage eine andere Zeit an.`,
      fallbackText:
        "Der Anbieter hat dir einen Termin vorgeschlagen. Bitte gib ihm eine Rückmeldung.",
      cta: "Zum Termin",
    },
    interest: {
      title: "Bist du weiterhin interessiert?",
      text: (date: string) =>
        `Die Besichtigung am ${date} hat stattgefunden. Teile dem Anbieter mit, ob du die Wohnung weiterhin mieten möchtest.`,
      fallbackText:
        "Die Besichtigung hat stattgefunden. Teile dem Anbieter mit, ob du die Wohnung weiterhin mieten möchtest.",
      cta: "Antworten",
      groupLabel: "Bist du weiterhin interessiert?",
      yes: "Ja, weiterhin interessiert",
      no: "Nein, nicht mehr interessiert",
      finalHint:
        "Deine Antwort geht an den Anbieter und kann danach nicht mehr geändert werden.",
      choice: (label: string) => `Deine Antwort: ${label}`,
      confirmHint:
        "Diese Antwort ist endgültig. Bitte bestätige, dass sie stimmt.",
      submit: "Antwort senden",
      submitting: "Wird gesendet …",
      back: "Zurück",
      error:
        "Deine Antwort konnte nicht gesendet werden. Bitte versuche es erneut.",
    },
  },
  states: {
    waiting: {
      title: "Du bist auf der Warteliste",
      text: "Sobald ein Platz frei wird, kann deine Bewerbung in den aktiven Prozess wechseln.",
      facts: [
        {
          key: "nothing",
          title: "Nichts zu tun",
          text: "Aktuell ist keine Aktion von dir nötig.",
        },
        {
          key: "hidden",
          title: "Profil noch verborgen",
          text: "Der Anbieter sieht deinen Namen und dein Profil erst, wenn deine Bewerbung aktiv wird.",
        },
      ],
      withdrawFact: {
        key: "withdraw",
        title: "Jederzeit zurückziehbar",
        text: "Du kannst deine Bewerbung zurückziehen, solange sie auf der Warteliste steht.",
      },
    },
    accepted: {
      eyebrow: "Zusage",
      title: "Der Anbieter hat sich für dich entschieden",
      text: "Herzlichen Glückwunsch. Deine Bewerbung wurde angenommen. Weitere Absprachen triffst du direkt mit dem Anbieter.",
      note: "Der Bewerbungsprozess ist abgeschlossen. Nachrichten, Unterlagen und Verlauf bleiben einsehbar.",
    },
    rejected: {
      title: "Absage für diese Wohnung",
      text: "Danke für dein Interesse. Nachrichten, Unterlagen und Verlauf bleiben für dich einsehbar.",
      reasonLabel: "Grund",
      reasons: {
        NOT_SELECTED:
          "Der Anbieter hat sich für eine andere Bewerbung entschieden.",
        LISTING_RENTED: "Die Wohnung ist bereits vermietet.",
        PROFILE_NO_LONGER_ELIGIBLE:
          "Dein Profil erfüllt die Voraussetzungen dieses Inserats nicht mehr.",
      },
      findMore: "Weitere Wohnungen finden",
    },
    withdrawn: {
      title: "Bewerbung zurückgezogen",
      text: (date: string) =>
        `Du hast deine Bewerbung am ${date} zurückgezogen. Der bisherige Verlauf bleibt einsehbar, Aktionen sind nicht mehr möglich.`,
      fallbackText:
        "Du hast deine Bewerbung zurückgezogen. Der bisherige Verlauf bleibt einsehbar, Aktionen sind nicht mehr möglich.",
    },
  },
  messages: {
    title: "Nachrichten",
    readOnly: "Nur lesbar",
    replyExpected: "Antwort erwartet",
    logLabel: "Nachrichtenverlauf mit dem Anbieter",
    provider: "Anbieter",
    you: "Du",
    today: "Heute",
    yesterday: "Gestern",
    empty: "Noch keine Nachrichten",
    loading: "Nachrichten werden geladen",
    loadError: "Nachrichten konnten nicht geladen werden.",
    retry: "Erneut versuchen",
    composerLabel: "Antwort an den Anbieter",
    placeholder: "Schreibe deine Antwort …",
    shortcut: "Strg + Enter zum Senden",
    send: "Senden",
    sending: "Wird gesendet …",
    sendError:
      "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.",
    sendInvalid:
      "Die Nachricht konnte nicht gesendet werden. Bitte prüfe den Text und versuche es erneut.",
    sendConflict:
      "Die Unterhaltung hat sich geändert. Dein Entwurf bleibt erhalten. Bitte prüfe den aktuellen Stand.",
    readError:
      "Der Lesestatus konnte nicht aktualisiert werden. Deine Nachrichten bleiben sichtbar.",
    notices: {
      notStarted: {
        title: "Der Anbieter hat die Unterhaltung noch nicht begonnen.",
        waitingText:
          "Während du auf der Warteliste stehst, ist keine Unterhaltung möglich.",
        text: "Du kannst antworten, sobald der Anbieter dir schreibt.",
      },
      notYourTurn: {
        title: "Du bist gerade nicht an der Reihe.",
        text: "Du kannst wieder antworten, sobald der Anbieter dir schreibt.",
      },
      closed: {
        title: "Diese Unterhaltung ist abgeschlossen.",
        text: "Der bisherige Verlauf bleibt für dich lesbar.",
      },
    },
  },
  documents: {
    detailsLoading: "Zeitangaben werden geladen …",
    detailsError: "Die Zeitangaben konnten nicht geladen werden.",
    retryDetails: "Erneut versuchen",
    title: "Unterlagen",
    allReviewed: "Alle geprüft",
    allUploaded: "Alle hochgeladen",
    progress: (done: number, total: number) =>
      `${done} von ${total} hochgeladen`,
    introActive: "Vom Anbieter angefordert. Erlaubt sind PDF, JPEG und PNG.",
    introClosed: "Vom Anbieter angefordert. Uploads sind nicht mehr möglich.",
    emptyTitle: "Keine Unterlagen angefordert",
    emptyWaiting:
      "Unterlagen können erst angefordert werden, wenn deine Bewerbung aktiv ist.",
    emptyText: "Der Anbieter hat keine Unterlagen angefordert.",
    requestedAt: (date: string) => `Angefordert am ${date}`,
    requested: "Vom Anbieter angefordert",
    processingAt: (dateTime: string) =>
      `Hochgeladen ${dateTime} · wird verarbeitet`,
    processing: "Hochgeladen · wird verarbeitet",
    uploadedAt: (date: string) => `Hochgeladen am ${date}`,
    uploaded: "Hochgeladen",
    reviewedAt: (date: string) => `Vom Anbieter geprüft am ${date}`,
    reviewed: "Vom Anbieter geprüft",
    states: {
      UPLOAD_REQUIRED: "Noch hochzuladen",
      PROCESSING: "Wird verarbeitet",
      RECEIVED: "Eingegangen",
      REVIEWED: "Geprüft",
    },
    upload: "Datei hochladen",
    uploadLabel: (label: string) => `${label} hochladen`,
    uploading: "Wird hochgeladen …",
    allowedTypes: "PDF, JPEG oder PNG",
    download: "Herunterladen",
    downloadLabel: (label: string) => `${label} herunterladen`,
    downloading: "Wird geladen …",
    downloadError:
      "Die Unterlage konnte nicht heruntergeladen werden. Bitte versuche es erneut.",
    uploadErrors: {
      type: "Bitte wähle eine PDF-, JPEG- oder PNG-Datei.",
      size: "Die Datei ist größer als 10 MB. Bitte wähle eine kleinere Datei.",
      empty: "Die Datei ist leer. Bitte wähle eine andere Datei.",
      rejected:
        "Die Datei wurde nicht angenommen. Bitte prüfe, ob es eine gültige PDF-, JPEG- oder PNG-Datei ist.",
      conflict:
        "Für diese Anforderung liegt bereits eine Unterlage vor. Der Stand wurde aktualisiert.",
      failed:
        "Die Unterlage konnte nicht hochgeladen werden. Bitte versuche es erneut.",
    },
    labels: {
      SCHUFA: "SCHUFA-Auskunft",
      INCOME_PROOF: "Einkommensnachweis",
      IDENTITY_DOCUMENT: "Ausweisdokument",
      LIABILITY_INSURANCE: "Nachweis Haftpflichtversicherung",
      OTHER: "Sonstiges Dokument",
    },
  },
  viewing: {
    detailsLoading: "Termindetails werden geladen …",
    detailsError:
      "Die zusätzlichen Termindetails konnten nicht geladen werden.",
    retryDetails: "Erneut versuchen",
    conflict:
      "Der Termin hat sich geändert. Bitte prüfe den aktuellen Stand, bevor du erneut antwortest.",
    title: "Besichtigung",
    states: {
      PROPOSED: "Vorgeschlagen",
      ACCEPTED: "Bestätigt",
      CHANGE_REQUESTED: "Andere Zeit angefragt",
      DECLINED: "Abgelehnt",
      COMPLETED: "Stattgefunden",
      NO_SHOW: "Nicht wahrgenommen",
      CANCELLED: "Abgesagt",
      SUPERSEDED: "Ersetzt",
    },
    texts: {
      PROPOSED:
        "Der Anbieter hat diesen Termin vorgeschlagen. Bitte gib ihm eine Rückmeldung.",
      PROPOSED_CLOSED: "Der Anbieter hatte diesen Termin vorgeschlagen.",
      ACCEPTED: "Du hast den Termin angenommen. Der Anbieter erwartet dich.",
      CHANGE_REQUESTED:
        "Du hast eine andere Zeit angefragt. Der Anbieter kann dir einen neuen Termin vorschlagen.",
      CHANGE_REQUESTED_CLOSED: "Du hattest eine andere Zeit angefragt.",
      DECLINED: "Du hast diesen Termin abgelehnt.",
      COMPLETED: "Die Besichtigung hat stattgefunden.",
      COMPLETED_PENDING:
        "Die Besichtigung hat stattgefunden. Bitte beantworte oben, ob du weiterhin interessiert bist.",
      NO_SHOW: "Der Termin wurde als nicht wahrgenommen vermerkt.",
      CANCELLED: "Der Anbieter hat diesen Termin abgesagt.",
      SUPERSEDED: "Dieser Termin wurde durch einen neuen Vorschlag ersetzt.",
    },
    timeRange: (start: string, end: string, zone: string) =>
      `${start} – ${end} Uhr · ${zone}`,
    providerNote: "Hinweis des Anbieters",
    myNote: "Deine Nachricht zur Anfrage",
    interestLabel: "Deine Rückmeldung nach der Besichtigung",
    interest: {
      STILL_INTERESTED: "Weiterhin interessiert",
      NOT_INTERESTED: "Nicht mehr interessiert",
    },
    interestSent: (dateTime: string) => `Endgültig übermittelt · ${dateTime}`,
    accept: "Termin annehmen",
    requestAnother: "Andere Zeit anfragen",
    decline: "Ablehnen",
    requestTitle: "Andere Zeit anfragen",
    requestText:
      "Der Anbieter erhält deine Anfrage und kann dir einen neuen Termin vorschlagen.",
    requestMessageLabel: "Nachricht an den Anbieter (optional)",
    requestPlaceholder: "z. B. Werktags passt es mir erst ab 18 Uhr.",
    characters: (count: number, max: number) => `${count} / ${max} Zeichen`,
    cancel: "Abbrechen",
    sendRequest: "Anfrage senden",
    declineTitle: "Termin ablehnen?",
    declineText:
      "Der Anbieter wird informiert. Wenn dir nur die Uhrzeit nicht passt, frage lieber eine andere Zeit an.",
    confirmDecline: "Termin ablehnen",
    back: "Zurück",
    pending: "Wird gesendet …",
    actionError:
      "Deine Rückmeldung konnte nicht gesendet werden. Bitte versuche es erneut.",
    emptyTitle: "Kein Termin",
    emptyWaiting:
      "Besichtigungen werden erst im aktiven Prozess vorgeschlagen.",
    emptyText: "Der Anbieter hat keinen Termin vorgeschlagen.",
  },
  history: {
    title: "Verlauf",
    latest: "Letzte 5 Ereignisse",
    count: (count: number) =>
      `${count} ${plural(count, "Ereignis", "Ereignisse")}`,
    showAll: "Gesamten Verlauf anzeigen",
    showLess: "Weniger anzeigen",
    loadMore: "Weitere Ereignisse laden",
    loading: "Verlauf wird geladen …",
    loadError: "Der Verlauf konnte nicht geladen werden.",
    retry: "Erneut versuchen",
    empty: "Noch keine Ereignisse",
  },
  withdraw: {
    title: "Bewerbung zurückziehen",
    waitingText:
      "Möglich, solange deine Bewerbung auf der Warteliste steht. Danach ist der Verlauf nur noch lesbar.",
    activeText:
      "Möglich, solange deine Bewerbung aktiv ist. Danach sind Nachrichten, Unterlagen und Besichtigungen nur noch lesbar.",
    action: "Bewerbung zurückziehen",
    dialogTitle: "Bewerbung zurückziehen?",
    dialogText: (title: string) =>
      `Deine Bewerbung für „${title}“ verlässt damit den Auswahlprozess. Nachrichten, Unterlagen und Besichtigungen werden schreibgeschützt, der bisherige Verlauf bleibt für dich lesbar. Du kannst diesen Schritt nicht rückgängig machen.`,
    confirm: "Bewerbung zurückziehen",
    pending: "Wird zurückgezogen …",
    cancel: "Abbrechen",
    error:
      "Deine Bewerbung konnte nicht zurückgezogen werden. Bitte versuche es erneut.",
  },
} as const;
