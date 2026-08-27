export const YES_NO_OPTIONS = ["ja", "nein"] as const;
export type YesNoOption = (typeof YES_NO_OPTIONS)[number] | "";

export const SMOKER_OPTIONS = ["ja", "nein"] as const;
export type SmokerOption = (typeof SMOKER_OPTIONS)[number] | "";

export const PROFILE_SECTION_IDS = ["sec-household", "sec-documents"] as const;
export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export const applicantProfileCopy = {
  cta: {
    create: "Bewerbungsprofil erstellen",
    edit: "Bewerbungsprofil bearbeiten",
  },
  topbar: {
    saved: "Gespeichert",
  },
  hero: {
    kicker: "Bewerbungsprofil",
    kickerAside: "Für passende Anfragen",
    title: "Dein Bewerbungsprofil",
    lead: "Vervollständige die Angaben, die für passende Bewerbungen benötigt werden. Dauert weniger als 2 Minuten.",
  },
  saveError: {
    title: "Profil konnte nicht gespeichert werden",
    text: "Bitte versuche es erneut. Deine Angaben sind noch vorhanden.",
    retry: "Erneut versuchen",
  },
  household: {
    num: "01 · Haushalt",
    title: "Einkommen und Haushaltsgröße",
    description:
      "Diese Angaben helfen Anbietern, deine Bewerbung passend einzuordnen.",
    fields: {
      income: {
        label: "Haushaltsnettoeinkommen",
        placeholder: "z. B. 3.200",
        suffix: "€ / Monat",
      },
      adults: {
        label: "Erwachsene",
      },
      children: {
        label: "Kinder",
      },
      householdSize: {
        label: "Haushaltsgröße",
        kicker: "Automatisch berechnet",
        unitSingular: "Person",
        unitPlural: "Personen",
      },
    },
  },
  documents: {
    num: "02 · Nachweise",
    title: "Nachweise & weitere Angaben",
    description:
      "Renyqo zeigt diese Angaben strukturiert an. Anbieter entscheiden selbst, was für ihr Mietobjekt zählt.",
    hint: "Nachweise musst du jetzt noch nicht hochladen. Falls du ausgewählt wirst, reichst du sie später ein.",
    fields: {
      incomeProof: {
        label: "Einkommensnachweis vorhanden",
        options: [
          { value: "ja", label: "Ja" },
          { value: "nein", label: "Nein" },
        ],
      },
      schufa: {
        label: "SCHUFA-Auskunft vorhanden",
        options: [
          { value: "ja", label: "Ja" },
          { value: "nein", label: "Nein" },
        ],
      },
      pets: {
        label: "Haustiere?",
        options: [
          { value: "nein", label: "Nein" },
          { value: "ja", label: "Ja" },
        ],
      },
      smoker: {
        label: "Raucher?",
        options: [
          { value: "nein", label: "Nein" },
          { value: "ja", label: "Ja" },
        ],
      },
    },
  },
  note: {
    body: "Deine Angaben werden strukturiert angezeigt und ausschließlich verwendet, um deine Bewerbungen und deine Eignung für ein Mietobjekt einzuschätzen.",
  },
  actions: {
    missingLabel: "Für ein vollständiges Profil fehlt noch",
    okLabel: "Profil vollständig ausgefüllt.",
    save: "Profil speichern",
    saving: "Speichert",
    saved: "Gespeichert",
    savedFlash: "Bewerbungsprofil gespeichert",
    invalidHint: "Bitte prüfe die markierten Angaben, bevor du speicherst.",
    loadError:
      "Dein Profil konnte nicht geladen werden. Deine Angaben werden beim Speichern übernommen.",
  },
  missingLabels: {
    income: "Haushaltsnettoeinkommen",
    incomeProof: "Einkommensnachweis",
    schufa: "SCHUFA-Auskunft",
    pets: "Haustiere?",
    smoker: "Raucher?",
  },
  validation: {
    income: "Bitte einen Betrag über 0 € angeben.",
  },
} as const;
