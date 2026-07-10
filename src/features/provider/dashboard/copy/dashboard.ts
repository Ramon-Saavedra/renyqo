import type { CandidateBadge, DashboardObjectStatus } from "../types";

export const ACCENTS = [
  { id: "schiefer", label: "Schiefer" },
  { id: "pastellblau", label: "Stahlblau" },
  { id: "salbei", label: "Salbei" },
  { id: "sand", label: "Honig" },
  { id: "apricot", label: "Koralle" },
  { id: "altrosa", label: "Altrosa" },
  { id: "flieder", label: "Lavendel" },
  { id: "eisblau", label: "Fjord" },
  { id: "stein", label: "Stein" },
  { id: "eukalyptus", label: "Eukalyptus" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export const DEFAULT_ACCENT: AccentId = "schiefer";

export const ACCENT_STORAGE_KEY = "renyqo:provider-accent";

export function isAccentId(value: string | null): value is AccentId {
  return value !== null && ACCENTS.some((accent) => accent.id === value);
}

export const OBJECT_STATUS_LABEL: Record<DashboardObjectStatus, string> = {
  published: "Veröffentlicht",
  draft: "Entwurf",
};

export interface CandidateBadgeMeta {
  readonly label: string;
  readonly className: string;
}

export const CANDIDATE_BADGE_META: Record<CandidateBadge, CandidateBadgeMeta> =
  {
    match: {
      label: "Passend",
      className: "bg-primary-tint text-primary",
    },
    askback: {
      label: "Rückfrage",
      className: "bg-background-muted text-warning",
    },
  };

export const dashboardCopy = {
  loading: "Dashboard wird vorbereitet …",
  profile: {
    name: "Sabine Kessler",
    company: "Kessler Immobilien GbR",
    initials: "SK",
    settings: "Konto & Profil",
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
    applicationsLabel: (active: number) => `${active} / 5 aktive Bewerbungen`,
    draftNotice: "Noch nicht veröffentlicht",
    share: {
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      copy: "Kopieren",
      copied: "Kopiert",
      copyAria: "Link kopieren",
    },
  },
  accent: {
    label: "Akzent",
    ariaLabel: "Akzentfarbe wählen",
  },
  stats: {
    objects: "Anzahl Objekte",
    objectsFoot: (published: number, drafts: number) =>
      `${published} veröffentlicht · ${drafts} Entwurf`,
    newApplications: "Neue Bewerbungen",
    newApplicationsFoot: "Seit gestern",
    drafts: "Entwürfe",
    draftsFoot: "Bereit zur Veröffentlichung",
  },
  object: {
    kicker: "Aktuell ausgewählt",
    edit: "Bearbeiten",
    preview: "Vorschau",
    livingArea: "Wohnfläche",
    rooms: "Zimmer",
    coldRent: "Kaltmiete",
    availableFrom: "Frei ab",
    applications: "Bewerbungen",
    applicationsValue: (active: number) => `${active} / 5 aktiv`,
    availableFromEmpty: "Offen",
    status: "Status",
  },
  candidates: {
    title: "Passende Kandidaten",
    lead: "Nur passende Bewerbungen werden aktiv angezeigt — höchstens fünf pro Objekt.",
    counterSuffix: "von 5 Plätzen belegt",
    profile: "Profil",
    chat: "Chat öffnen",
    emptySlot: "Platz frei für passende Bewerbung",
    draftEmpty:
      "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
  },
} as const;
