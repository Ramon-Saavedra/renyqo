export const OBJECT_TYPES = ["wohnung", "haus", "zimmer"] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

export const REQUIREMENT_OPTIONS = [
  "erforderlich",
  "optional",
  "nein",
] as const;
export type RequirementOption = (typeof REQUIREMENT_OPTIONS)[number];

export const PET_OPTIONS = ["erlaubt", "absprache", "keine"] as const;
export type PetOption = (typeof PET_OPTIONS)[number] | "";

export const SMOKING_OPTIONS = [
  "erlaubt",
  "absprache",
  "nichtraucher",
] as const;
export type SmokingOption = (typeof SMOKING_OPTIONS)[number] | "";

function rangeStep(min: number, max: number, step: number): readonly string[] {
  const out: string[] = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    out.push(String(min + i * step));
  }
  return out;
}

export const ROOM_OPTIONS: readonly string[] = rangeStep(1, 50, 0.5);
export const BEDROOM_OPTIONS: readonly string[] = rangeStep(0, 50, 1);
export type RoomOption = string;

export const SECTION_IDS = ["sec-01", "sec-02", "sec-03"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  wohnung: "Wohnung",
  haus: "Haus",
  zimmer: "Zimmer",
};

export const createListingCopy = {
  topbar: {
    draft: "Entwurf · Nicht öffentlich",
    unsavedChanges: "Ungespeicherte Änderungen",
    saved: "Gespeichert",
    saveError: "Speichern fehlgeschlagen",
    undo: "Rückgängig",
    redo: "Wiederholen",
    back: "Zurück",
    backHref: "/provider/get-started",
  },
  hero: {
    kicker: "Neues Mietobjekt",
    kickerStep: "Schritt für Schritt",
    title: "Erstes Mietobjekt anlegen",
    fallbackTitle: "Neues Mietobjekt anlegen",
    nextTitle: "Weiteres Mietobjekt anlegen",
    lead: "Erfasse die wichtigsten Daten deiner Immobilie. Du kannst jederzeit als Entwurf speichern und später weiterarbeiten — nichts wird veröffentlicht, bevor du es selbst freigibst.",
  },
  headerNav: {
    myListings: "Meine Objekte",
    myListingsHref: "/provider/listings",
    dashboard: "Dashboard",
    dashboardHref: "/provider/dashboard",
    unsavedChangesModal: {
      title: "Änderungen verwerfen?",
      text: "Du hast ungespeicherte Änderungen. Wenn du die Seite verlässt, gehen diese Änderungen verloren.",
      primary: "Weiter bearbeiten",
      secondary: "Ohne Speichern verlassen",
      tertiary: "Als Entwurf speichern & verlassen",
      tertiaryPending: "Entwurf wird gespeichert",
      saveError:
        "Der Entwurf konnte nicht gespeichert werden. Bitte versuche es erneut.",
    },
  },
  stepper: {
    ariaLabel: "Fortschritt",
    steps: [
      { id: "sec-01", label: "Objektdaten" },
      { id: "sec-02", label: "Anforderungen" },
      { id: "sec-03", label: "Abschluss" },
    ] as const,
  },
  objektdaten: {
    num: "01 · Objektdaten",
    title: "Das Wichtigste zu deiner Immobilie",
    description:
      "Diese Angaben helfen Suchenden, dein Objekt zu finden. Ein Stern bedeutet: wird für die Veröffentlichung benötigt.",
    fields: {
      street: {
        label: "Straße",
        placeholder: "Musterstraße 12",
      },
      zip: {
        label: "PLZ",
        placeholder: "10115",
      },
      city: {
        label: "Stadt",
        placeholder: "Berlin",
      },
      hideAddress: {
        label: "Adresse vorerst nicht öffentlich anzeigen",
        sub: "Suchende sehen zunächst nur die Stadt und ungefähre Lage. Die genaue Adresse gibst du erst frei, wenn du Kontakt aufnehmen möchtest.",
      },
      objectType: {
        label: "Objekttyp",
        options: [
          { value: "wohnung", label: "Wohnung" },
          { value: "haus", label: "Haus" },
          { value: "zimmer", label: "Zimmer" },
        ],
      },
      area: { label: "Wohnfläche", placeholder: "z. B. 68", suffix: "m²" },
      rooms: { label: "Zimmer", placeholder: "Bitte wählen" },
      bedrooms: { label: "Schlafzimmer", placeholder: "Bitte wählen" },
      price: {
        label: "Kaltmiete",
        placeholder: "z. B. 980",
        suffix: "€ / Monat",
      },
      additionalCosts: {
        label: "Nebenkosten",
        placeholder: "z. B. 200",
        suffix: "€ / Monat",
      },
      deposit: {
        label: "Kaution",
        empty: "—",
      },
      availableFrom: { label: "Frei ab" },
      title: {
        label: "Objekttitel",
        overrideLabelActive: "Eigener Titel · aktiv",
        overrideLabelIdle: "Eigener Titel · optional",
        overridePlaceholder: "z. B. Helle Altbauwohnung mit Balkon",
        overrideHint:
          "Wenn du hier etwas einträgst, wird der automatische Vorschlag ersetzt.",
      },
      description: {
        label: "Kurzbeschreibung",
        placeholder:
          "Was macht dein Objekt besonders? Helle Räume, ruhige Lage, gute Verkehrsanbindung — beschreibe in 2–3 Sätzen, was Suchende wissen sollten.",
        hint: "Optional. Du kannst die Beschreibung später jederzeit anpassen.",
        maxLength: 800,
        warnAt: 600,
      },
      photos: {
        label: "Fotos",
        addLabel: "Foto hinzufügen",
        dropTitle: "Fotos hier ablegen",
        dropAction: "oder Foto auswählen",
        dropHint: "JPG, PNG oder WebP · max. 10 MB pro Bild",
        dropActive: "Loslassen zum Hinzufügen",
        cover: "Titelbild",
        hint: "Unterstützte Formate: JPG, PNG, WebP. Max. 10 MB pro Bild. Das erste Foto erscheint als Titelbild. Querformat sieht in den Suchergebnissen am besten aus.",
        remove: "Entfernen",
        max: 12,
        errors: {
          tooLarge: "Das Bild ist zu groß. Bitte lade ein Bild bis 10 MB hoch.",
          invalidFormat:
            "Bitte lade ein Bild im Format JPG, PNG oder WebP hoch.",
          uploadFailed:
            "Das Bild konnte nicht hochgeladen werden. Bitte versuche es erneut.",
        },
      },
    },
  },
  anforderungen: {
    num: "02 · Anforderungen",
    title: "Wer würde gut zu deinem Objekt passen?",
    description:
      "Praktische Erwartungen — kein Ausschlusskriterium. Renyqo zeigt deine Angaben strukturiert an, damit Suchende einschätzen können, ob es passt.",
    fields: {
      minIncome: {
        label: "Mindesteinkommen netto",
        placeholder: "z. B. 2.500",
        suffix: "€ / Monat",
        hint: "Als Orientierung gilt häufig das Dreifache der Kaltmiete.",
      },
      schufa: {
        label: "SCHUFA-Auskunft",
        options: [
          { value: "erforderlich", label: "Erforderlich" },
          { value: "optional", label: "Optional" },
          { value: "nein", label: "Nicht nötig" },
        ],
      },
      income: {
        label: "Einkommensnachweis",
        options: [
          { value: "erforderlich", label: "Erforderlich" },
          { value: "optional", label: "Optional" },
          { value: "nein", label: "Nicht nötig" },
        ],
      },
      peopleCount: {
        label: "Passend für insgesamt",
        empty: "Nicht festgelegt",
      },
      pets: {
        label: "Haustiere",
        options: [
          { value: "erlaubt", label: "Erlaubt" },
          { value: "keine", label: "Nicht erlaubt" },
          { value: "absprache", label: "Auf Anfrage" },
        ],
      },
      smoking: {
        label: "Rauchen",
        options: [
          { value: "erlaubt", label: "Erlaubt" },
          { value: "nichtraucher", label: "Nicht erlaubt" },
          { value: "absprache", label: "Auf Anfrage" },
        ],
      },
    },
    note: {
      lead: "Hinweis:",
      body: "Renyqo überprüft Dokumente nicht offiziell. Angaben werden so übernommen, wie Suchende sie hinterlegt haben, und strukturiert angezeigt — du entscheidest, was dir genügt.",
    },
  },
  abschluss: {
    num: "03 · Abschluss",
    title: "Bereit zum Speichern oder Veröffentlichen?",
    description:
      "Als Entwurf bleibt dein Objekt privat — nur du siehst es. Erst nach dem Veröffentlichen wird es für Suchende sichtbar.",
    statusPill: "Entwurf",
    statusHint: "Aktueller Status — nicht öffentlich sichtbar.",
    legal: {
      label:
        "Ich bin Eigentümer:in oder bevollmächtigt, dieses Objekt zu inserieren.",
      sub: "Du bleibst der einzige Ansprechpartner. Renyqo nimmt keinen Kontakt zu Suchenden auf, bevor du selbst antwortest. — Pflichtfeld für die Veröffentlichung.",
    },
    actions: {
      missingLabel: "Noch fehlt",
      okLabel: "Alle Pflichtangaben vollständig — du kannst veröffentlichen.",
      saveDraft: "Als Entwurf speichern",
      savingDraft: "Wird gespeichert",
      publish: "Veröffentlichen",
      publishing: "Wird veröffentlicht",
      publishHelp: "Bitte zuerst alle Pflichtfelder ausfüllen",
    },
  },
  preview: {
    kicker: "So sehen Suchende dein Objekt",
    kickerTag: "Vorschau",
    badgeDraft: "Entwurf",
    photoPlaceholder: "Foto erscheint hier",
    titlePlaceholder: "Titel wird generiert …",
    addressPlaceholder: "Adresse hinzufügen",
    addressHidden: "Lage wird nach Veröffentlichung sichtbar",
    stats: {
      area: "Fläche",
      rooms: "Zimmer",
      bedrooms: "Schlafzimmer",
      availableFrom: "Frei ab",
    },
    empty: "—",
    priceMissing: "Kaltmiete fehlt",
    priceUnit: "/ Monat",
    priceKicker: "Kalt",
    note: {
      body: "Diese Vorschau ist nur für dich sichtbar. Suchende sehen dein Inserat erst nach dem ",
      bodyBold: "Veröffentlichen",
      bodyTail: ".",
    },
  },
  missingLabels: {
    city: "Stadt",
    zip: "PLZ",
    street: "Straße",
    area: "Wohnfläche",
    rooms: "Zimmer",
    bedrooms: "Schlafzimmer",
    price: "Kaltmiete",
    availableFrom: "Frei ab",
    photo: "Mindestens 1 Foto",
    legal: "Bestätigung",
  },
  validation: {
    city: "Bitte gib eine Stadt an",
    zip: "Bitte gib die Postleitzahl an",
    street: "Bitte gib die Straße an",
    area: "Bitte gib die Wohnfläche an",
    rooms: "Bitte wähle die Zimmeranzahl",
    bedrooms: "Bitte gib die Anzahl der Schlafzimmer an",
    price: "Bitte gib die Kaltmiete an",
    additionalCosts: "Bitte gib einen gültigen Betrag an",
    deposit: "Bitte gib einen gültigen Betrag an",
    depositMonths: "Bitte wähle eine gültige Kaution",
    availableFrom: "Bitte wähle ein Datum",
    minIncome: "Bitte gib einen gültigen Betrag an",
    peopleCount: "Bitte gib eine gültige Personenanzahl an",
    photos: "Mindestens 1 Foto ist erforderlich",
    legalAccepted: "Bitte bestätige die Berechtigung zur Inserierung",
  },
} as const;
