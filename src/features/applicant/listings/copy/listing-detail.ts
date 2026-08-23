export const listingDetailCopy = {
  backHref: "/listings",
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
    minimumIncome: "Mindesteinkommen (netto)",
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
