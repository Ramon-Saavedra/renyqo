export const accountTypeCopy = {
  back: "Zurück",
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
      benefits: [
        "Keine wochenlange Funkstille mehr nach deiner Anfrage.",
        "Du siehst vorab, ob ein Mietobjekt wirklich zu deinem Profil passt.",
        "Dein Mietprofil ist vorbereitet, bevor es ernst wird.",
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
      benefits: [
        "Weniger unpassende Anfragen. Mehr relevante Bewerbungen.",
        "Du siehst schneller, welche Kandidaten wirklich zum Objekt passen.",
        "Klare Anforderungen vorab, statt wochenlang Bewerbungen zu sortieren.",
      ],
    },
  },
} as const;

export type Role = keyof typeof accountTypeCopy.roles;
