import type { ListingStatus, SortKey, StatusFilterKey } from "../types";

export interface StatusFilterEntry {
  readonly id: StatusFilterKey;
  readonly label: string;
}

export interface SortOption {
  readonly id: SortKey;
  readonly label: string;
}

export interface StatusMeta {
  readonly label: string;
  readonly pillClass: string;
}

export const STATUS_META: Record<ListingStatus, StatusMeta> = {
  published: {
    label: "Aktiv",
    pillClass: "bg-primary-tint text-primary",
  },
  draft: {
    label: "Entwurf",
    pillClass: "bg-background-muted text-foreground-tertiary",
  },
  paused: {
    label: "Pausiert",
    pillClass: "bg-background-muted text-foreground-secondary",
  },
  rented: {
    label: "Vermietet",
    pillClass: "bg-success/10 text-success",
  },
  archived: {
    label: "Archiviert",
    pillClass: "bg-background-subtle text-foreground-tertiary",
  },
};

export const STATUS_SORT_ORDER: readonly ListingStatus[] = [
  "published",
  "draft",
  "paused",
  "rented",
  "archived",
];

export const STATUS_FILTERS: readonly StatusFilterEntry[] = [
  { id: "alle", label: "Alle" },
  { id: "published", label: "Aktiv" },
  { id: "draft", label: "Entwürfe" },
  { id: "paused", label: "Pausiert" },
  { id: "rented", label: "Vermietet" },
  { id: "archived", label: "Archiviert" },
  { id: "attention", label: "Klärung nötig" },
];

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: "updated", label: "Zuletzt aktualisiert" },
  { id: "created", label: "Neueste zuerst" },
  { id: "applications", label: "Bewerbungen" },
  { id: "status", label: "Status" },
];

export const listingsCopy = {
  topbar: {
    back: "Zurück zum Dashboard",
    backHref: "/provider/dashboard",
  },
  hero: {
    kicker: "/ provider / listings",
    title: "Meine Objekte",
    lead: "Verwalte deine Mietobjekte, Entwürfe und archivierten Einträge an einem Ort.",
    newLabel: "Neues Mietobjekt",
    newHref: "/provider/listings/new",
  },
  trust: {
    lead: "Anforderungen sind ",
    leadStrong: "praktische Erwartungen",
    leadTail:
      " — kein Ausschlusskriterium. SCHUFA & Einkommen werden strukturiert angezeigt.",
  },
  toolbar: {
    searchPlaceholder: "Suche nach Adresse, Titel oder Ort",
    searchClearLabel: "Suche leeren",
    searchAriaLabel: "Mietobjekte durchsuchen",
  },
  filter: {
    ariaLabel: "Statusfilter",
  },
  sort: {
    triggerLabel: "Sortieren:",
    menuAriaLabel: "Sortierung wählen",
  },
  summary: {
    singular: "Objekt",
    plural: "Objekte",
    filteredOf: (total: number) => `von ${total} gefiltert`,
  },
  row: {
    coldRent: "Kaltmiete",
    livingArea: "Fläche",
    rooms: "Zimmer",
    applications: "Bewerbungen",
    applicationsAria: (active: number) => `${active} von 5 aktiven Bewerbungen`,
    applicationsLabel: (visible: number, waiting: number) =>
      waiting > 0
        ? `${visible} sichtbar · ${waiting} wartend`
        : `${visible} sichtbar`,
    activity: "Letzte Aktivität",
    editLabel: "Bearbeiten",
    moreLabel: "Aktionen",
  },
  actions: {
    preview: "Vorschau",
    edit: "Bearbeiten",
    pause: "Pausieren",
    rented: "Als vermietet markieren",
    archive: "Archivieren",
  },
  empty: {
    titleFresh: "Noch keine Mietobjekte angelegt.",
    leadFresh:
      "Sobald du dein erstes Mietobjekt anlegst, erscheint es hier in der Übersicht.",
    titleArchived: "Du hast aktuell keine aktiven Mietobjekte.",
    leadArchived:
      "Lege ein neues Mietobjekt an, oder sieh dir deine bereits vermieteten und archivierten Einträge an.",
    ctaNew: "Neues Mietobjekt anlegen",
    ctaShowAll: "Alle Objekte anzeigen",
    filteredTitle: "Keine Objekte für diese Filter.",
    filteredLead:
      "Setze den Statusfilter auf „Alle“ zurück oder lösche die Suche, um wieder alle Objekte zu sehen.",
    ctaReset: "Filter zurücksetzen",
  },
  attention: {
    label: "Klärung nötig",
  },
} as const;
