import { MAX_ACTIVE_APPLICATIONS, type DashboardObjectStatus } from "../types";

export const ACCENTS = [
  { id: "schiefer", label: "Schiefer" },
  { id: "pastellblau", label: "Tiefes Petrol" },
  { id: "salbei", label: "Salbeigrün" },
  { id: "sand", label: "Burgunder" },
  { id: "apricot", label: "Tiefes Indigo" },
  { id: "altrosa", label: "Kakaobraun" },
  { id: "flieder", label: "Ocker" },
  { id: "eisblau", label: "Graphit" },
  { id: "stein", label: "Waldgrün" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "schiefer";

export const ACCENT_STORAGE_KEY = "renyqo:provider-accent";
export const SELECTED_OBJECT_STORAGE_KEY = "renyqo:provider-dashboard-object";

export function isAccentId(value: string | null): value is AccentId {
  return value !== null && ACCENTS.some((accent) => accent.id === value);
}

export const OBJECT_STATUS_LABEL: Record<DashboardObjectStatus, string> = {
  published: "Veröffentlicht",
  draft: "Entwurf",
};

export const dashboardCopy = {
  loading: "Dashboard wird vorbereitet …",
  error:
    "Dashboard konnte nicht geladen werden. Bitte versuche es gleich erneut.",
  profile: {
    name: "Sabine Kessler",
    company: "Kessler Immobilien GbR",
    initials: "SK",
    settings: "Konto & Profil",
    logoutError: "Abmeldung fehlgeschlagen. Bitte versuche es erneut.",
  },
  topbar: {
    searchPlaceholder: "Adresse oder Titel suchen …",
    searchAria: "Mietobjekte durchsuchen",
    searchClear: "Suche leeren",
    objects: "Meine Objekte",
    objectsHref: "/provider/listings",
    newListing: "Neues Mietobjekt",
    newListingHref: "/provider/listings/new",
  },
  sidebar: {
    heading: "Meine Mietobjekte",
    collapse: "Ausblenden",
    reopen: "Objekte einblenden",
    searchPlaceholder: "Objekte filtern …",
    searchAria: "Objekte filtern",
    searchClear: "Filter leeren",
    empty: "Keine Objekte gefunden.",
    rentSuffix: "kalt",
    rentLabel: "Kaltmiete",
    applications: "Bewerbungen",
    draftNotice: "Noch nicht veröffentlicht",
    share: {
      aria: "Objekt teilen",
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      copy: "Kopieren",
      copied: "Kopiert",
      copyAria: "Link kopieren",
    },
  },
  accent: {
    label: "Akzentfarbe anpassen",
    ariaLabel: "Akzentfarbe wählen",
  },
  stats: {
    objects: "Anzahl Objekte",
    objectsFoot: (published: number, drafts: number) =>
      `${published} veröffentlicht · ${drafts} Entwurf`,
    activeApplications: "Aktive Bewerbungen",
    drafts: "Entwürfe",
    draftsFoot: "Bereit zur Veröffentlichung",
  },
  object: {
    kicker: "Aktuell ausgewählt",
    emptyTitle: "Noch keine Mietobjekte",
    emptyAddress: "Lege ein Mietobjekt an, um Details zu sehen.",
    edit: "Bearbeiten",
    preview: "Vorschau",
    publishedCaption: "Veröffentlicht am",
    updatedCaption: "Zuletzt bearbeitet am",
    livingArea: "Wohnfläche",
    rooms: "Zimmer",
    coldRent: "Kaltmiete",
    availableFrom: "Frei ab",
    applications: "Bewerbungen",
    applicationsValue: (active: number) =>
      `${active} / ${MAX_ACTIVE_APPLICATIONS} aktiv`,
    availableFromEmpty: "Offen",
    status: "Status",
  },
  candidates: {
    title: "Passende Kandidaten",
    lead: `Nur passende Bewerbungen werden aktiv angezeigt — höchstens ${MAX_ACTIVE_APPLICATIONS} pro Objekt.`,
    activeOccupancy: (active: number) =>
      `${active} / ${MAX_ACTIVE_APPLICATIONS} aktiv`,
    emptySlotPrimary: "Freier Platz",
    emptySlotSecondary: "für passende Bewerbung",
    draftEmpty:
      "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
    loadError:
      "Bewerbungen konnten nicht geladen werden. Bitte versuche es gleich erneut.",
    householdOne: "1 Person",
    householdMany: (count: number) => `${count} Personen`,
    householdUnavailable: "Haushalt nicht angegeben",
    warningLabels: {
      pets_by_arrangement: "Rückfrage: Haustiere",
      smoking_by_arrangement: "Rückfrage: Rauchen",
    },
  },
  waitingBanner: {
    singular: "1 weitere passende Bewerbung wartet",
    plural: (count: number) => `${count} weitere passende Bewerbungen warten`,
    empty: "Aktuell keine weiteren passenden Bewerbungen in der Warteschlange",
    loadError: "Warteschlange konnte nicht geladen werden.",
  },
} as const;
