export const listingDetailCopy = {
  backLabel: "Zurück zu den Suchergebnissen",
  backLinkShort: "Zurück zur Suche",

  loading: "Objekt wird geladen …",
  loadingAriaLabel: "Objekt wird geladen",

  notFoundTitle: "Objekt nicht gefunden",
  notFoundLead: "Dieses Objekt existiert nicht oder wurde entfernt.",
  errorDefault: "Objekt konnte nicht geladen werden",
  errorNetwork: "Netzwerkfehler — bitte versuche es erneut",
  errorLead:
    "Bitte versuche es später erneut oder kehre zu den Suchergebnissen zurück.",

  price: {
    cold: (value: string) => `${value} kalt`,
    serviceCharge: (value: string) => `zzgl. ${value} NK`,
  },

  match: {
    matches: "Passt zu deinem Profil",
    doesNotMatch: "Passt nicht zu deinem Profil",
    incomplete: "Profil unvollständig",
    unknown: "Eignung unbekannt",
  },

  apply: {
    label: "Bewerben",
    anonymousLead: "Du möchtest dich auf dieses Mietobjekt bewerben?",
    start: "Bewerbung starten",
  },

  save: {
    label: "Merken",
    savedLabel: "Gemerkt",
    error: "Das Objekt konnte nicht gemerkt werden.",
    errorAuth: "Bitte melde dich an, um dieses Objekt zu merken.",
    errorForbidden: "Du kannst dieses Objekt derzeit nicht merken.",
    errorNotFound: "Dieses Objekt ist nicht mehr verfügbar.",
    unsaveError: "Das Objekt konnte nicht von den Gemerkten entfernt werden.",
    unsaveErrorAuth:
      "Bitte melde dich an, um dieses Objekt von den Gemerkten zu entfernen.",
    unsaveErrorForbidden:
      "Du kannst dieses Objekt derzeit nicht von den Gemerkten entfernen.",
    unsaveErrorNotFound: "Dieses Objekt ist nicht mehr verfügbar.",
  },

  report: {
    label: "Melden",
    title: "Objekt melden",
    lead: "Sag uns, warum dieses Inserat nicht in Ordnung ist.",
    submit: "Meldung senden",
    submitting: "Meldung wird gesendet …",
    cancel: "Abbrechen",
    close: "Schließen",
    reasonsLabel: "Grund",
    detailLabel: "Details",
    detailHint: "Optional. Maximal 500 Zeichen.",
    detailRequiredHint: "Bitte beschreibe kurz, was nicht stimmt.",
    reasonRequired: "Bitte wähle einen Grund.",
    detailRequired: "Bitte beschreibe den Grund.",
    detailTooLong: "Bitte kürze den Text auf 500 Zeichen.",
    success: "Danke, wir haben deine Meldung erhalten.",
    error: "Die Meldung konnte nicht gesendet werden.",
    errorDuplicate: "Du hast dieses Objekt bereits gemeldet.",
    errorRateLimited:
      "Du hast zu viele Meldungen gesendet. Bitte versuche es später erneut.",
    errorAuth: "Bitte melde dich an, um ein Objekt zu melden.",
    reasons: {
      MISLEADING_INFO: "Irreführende oder falsche Angaben",
      SCAM_OR_FRAUD: "Betrugsverdacht",
      DISCRIMINATION: "Diskriminierung",
      INAPPROPRIATE_CONTENT: "Unangemessene Inhalte",
      DUPLICATE_OR_SPAM: "Doppeltes Inserat / Spam",
      OTHER: "Sonstiges",
    },
  },

  notSelected: {
    lead: "Eine erneute Bewerbung ist nicht möglich.",
  },

  photos: {
    galleryLabel: "Fotos des Objekts",
    imageAlt: (title: string | null, index: number) =>
      title ? `${title} — Foto ${index}` : `Foto ${index}`,
    more: (count: number) => `+${count}`,
    moreLabel: (count: number) =>
      count === 1 ? "1 weiteres Foto" : `${count} weitere Fotos`,
    empty: "Kein Foto vorhanden",
  },

  facts: {
    title: "Kerndaten",
    rooms: "Zimmer",
    livingArea: "Fläche",
    bedrooms: "Schlafzimmer",
    objectType: "Objekttyp",
    availableFrom: "Verfügbar ab",
  },

  description: {
    title: "Kurzbeschreibung",
    more: "Mehr anzeigen",
    less: "Weniger anzeigen",
    empty: "Für dieses Objekt liegt noch keine Beschreibung vor.",
  },

  requirements: {
    title: "Anforderungen",
    schufa: "SCHUFA",
    incomeProof: "Einkommensnachweis",
    householdSize: "Haushaltsgröße",
    pets: "Haustiere",
    smoking: "Rauchen",
    required: "Erforderlich",
    notRequired: "Nicht erforderlich",
    householdSizeValue: (count: number) =>
      count === 1 ? "1 Person" : `1–${count} Personen`,
    empty: "Für dieses Objekt sind keine Anforderungen hinterlegt.",
  },
} as const;
