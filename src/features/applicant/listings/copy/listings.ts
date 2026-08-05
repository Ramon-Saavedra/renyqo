import type { SortKey } from "../types";

export interface SortOption {
  readonly id: SortKey;
  readonly label: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: "newest", label: "Neueste zuerst" },
  { id: "price-asc", label: "Günstigste zuerst" },
  { id: "price-desc", label: "Teuerste zuerst" },
  { id: "area-desc", label: "Größte Wohnfläche" },
];

export const COLD_RENT_OPTIONS: readonly {
  readonly value: number | null;
  readonly label: string;
}[] = [
  { value: null, label: "Egal" },
  { value: 700, label: "bis 700 €" },
  { value: 900, label: "bis 900 €" },
  { value: 1200, label: "bis 1.200 €" },
  { value: 1500, label: "bis 1.500 €" },
  { value: 2000, label: "bis 2.000 €" },
];

export const ROOM_OPTIONS: readonly {
  readonly value: number | null;
  readonly label: string;
}[] = [
  { value: null, label: "Egal" },
  { value: 1, label: "ab 1 Zimmer" },
  { value: 2, label: "ab 2 Zimmer" },
  { value: 3, label: "ab 3 Zimmer" },
  { value: 4, label: "ab 4 Zimmer" },
];

export const AREA_OPTIONS: readonly {
  readonly value: number | null;
  readonly label: string;
}[] = [
  { value: null, label: "Egal" },
  { value: 40, label: "ab 40 m²" },
  { value: 60, label: "ab 60 m²" },
  { value: 80, label: "ab 80 m²" },
  { value: 100, label: "ab 100 m²" },
];

export const listingsCopy = {
  hero: {
    kicker: "/ listings",
    title: "Wohnungen finden, die wirklich zu dir passen.",
    lead: "Durchsuche aktuelle Angebote und erkenne mit deinem Bewerbungsprofil sofort, welche Wohnungen für dich infrage kommen.",
  },
  console: {
    ariaLabel: "Suche und Filter",
    searchPlaceholder: "Ort, Stadtteil oder Postleitzahl",
    searchAriaLabel: "Wohnungen nach Ort durchsuchen",
    searchClearLabel: "Suche leeren",
    examplePrefix: "z. B.",
    examples: ["Freiburg", "Rieselfeld", "3 Zimmer", "Haustiere erlaubt"],
    onlyMatching: "Nur passende Wohnungen",
    onlyMatchingHint:
      "Zeigt nur Wohnungen, deren Anforderungen zu deinem Bewerbungsprofil passen.",
  },
  filters: {
    coldRent: "Kaltmiete",
    rooms: "Zimmer",
    livingArea: "Wohnfläche",
    availableFrom: "Verfügbar ab",
    more: "Weitere Filter",
    mobileTrigger: "Filter",
    reset: "Alle Filter zurücksetzen",
    availableFromLabel: "Einzug spätestens am",
    drawerTitle: "Filter",
    drawerClose: "Filter schließen",
    drawerApply: (count: number) =>
      count === 1 ? "1 Ergebnis anzeigen" : `${count} Ergebnisse anzeigen`,
  },
  results: {
    count: (count: number) =>
      count === 1 ? "1 Wohnung gefunden" : `${count} Wohnungen gefunden`,
    sortTriggerLabel: "Sortieren:",
    sortMenuAriaLabel: "Sortierung wählen",
    loadMore: "Mehr Wohnungen anzeigen",
    gridAriaLabel: "Gefundene Wohnungen",
  },
  card: {
    badgeNew: "Neu",
    badgeMatch: "Passt",
    badgeNoMatch: "Passt nicht",
    matchLine: "Passt zu deinem Profil",
    noMatchLine: "Passt nicht zu deinem Profil",
    coldRent: "Kaltmiete",
    serviceCharge: (value: string) => `+ ${value} NK`,
    availableFrom: (value: string) => `ab ${value}`,
    noImage: "Kein Foto vorhanden",
  },
  profileNotice: {
    lead: "Erstelle dein ",
    leadStrong: "Bewerbungsprofil",
    leadTail: ", um sofort passende Wohnungen zu erkennen.",
  },
  empty: {
    title: "Keine Wohnungen gefunden",
    lead: "Für deine aktuelle Suche gibt es keine Treffer. Passe deine Filter an oder setze sie zurück.",
    reset: "Alle Filter zurücksetzen",
  },
  error: {
    message:
      "Wohnungen konnten nicht geladen werden. Deine Filter bleiben erhalten.",
    retry: "Erneut versuchen",
  },
  loading: "Wohnungen werden geladen …",
  detail: {
    loading: "Objekt wird geladen …",
    notFoundTitle: "Objekt nicht gefunden",
    notFoundLead: "Dieses Objekt existiert nicht oder wurde entfernt.",
    backLink: "Zurück zur Suche",
    errorDefault: "Objekt konnte nicht geladen werden",
    errorNetwork: "Netzwerkfehler — bitte versuche es erneut",
  },
} as const;
