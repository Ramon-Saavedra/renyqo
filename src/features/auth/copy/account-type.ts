export const accountTypeCopy = {
  back: "Zurück",
  steps: ["02 Kontotyp", "03 Daten", "04 Bestätigung"],
  title: "Wie möchtest du {brand} nutzen?",
  subtitle:
    "Wähle die Rolle, die zu dir passt. Du kannst dies später nicht ohne Weiteres ändern.",
  alreadyAccount: "Bereits ein Konto?",
  signIn: "Anmelden",
  next: "Weiter",
  roles: {
    applicant: {
      kicker: "Für Suchende",
      title: "Ich suche ein Zuhause",
      description:
        "Bereite dein Mietprofil einmal sauber vor und bewirb dich nur auf Mietobjekte, deren Anforderungen wirklich zu dir passen.",
      points: [
        "Mietprofil mit Nachweisen vorbereiten",
        "Passende Mietobjekte schneller erkennen",
        "Kontakt erst, wenn es wirklich passt",
      ],
    },
    provider: {
      kicker: "Für Eigentümer & Makler",
      title: "Ich biete ein Mietobjekt an",
      description:
        "Lege die Anforderungen deines Mietobjekts vorab fest und erhalte nur Bewerbungen, die fachlich und finanziell zum Objekt passen.",
      points: [
        "Anforderungen klar definieren",
        "Bewerbungen automatisch vorsortieren",
        "Kandidaten-Dossiers auf einen Blick",
      ],
    },
  },
} as const;

export type Role = keyof typeof accountTypeCopy.roles;
