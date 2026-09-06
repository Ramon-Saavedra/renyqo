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
  { value: 800, label: "bis 800 €" },
  { value: 1000, label: "bis 1.000 €" },
  { value: 1300, label: "bis 1.300 €" },
  { value: 1600, label: "bis 1.600 €" },
  { value: 2000, label: "bis 2.000 €" },
];

export const ROOM_OPTIONS: readonly {
  readonly value: number | null;
  readonly label: string;
}[] = [
  { value: null, label: "Egal" },
  { value: 1, label: "ab 1" },
  { value: 2, label: "ab 2" },
  { value: 3, label: "ab 3" },
  { value: 4, label: "ab 4" },
  { value: 5, label: "ab 5" },
];

export const AREA_OPTIONS: readonly {
  readonly value: number | null;
  readonly label: string;
}[] = [
  { value: null, label: "Egal" },
  { value: 30, label: "ab 30 m²" },
  { value: 50, label: "ab 50 m²" },
  { value: 80, label: "ab 80 m²" },
  { value: 100, label: "ab 100 m²" },
  { value: 140, label: "ab 140 m²" },
];

export const listingsCopy = {
  hero: {
    titles: [
      "Mietobjekte finden, die wirklich zu dir passen.",
      "Wohnungen, Häuser und Zimmer. Einfach gefunden.",
      "Weniger suchen. Schneller passend wohnen.",
    ],
    lead: "Durchsuche aktuelle Angebote und erkenne mit deinem Bewerbungsprofil sofort, welche Objekte für dich infrage kommen.",
  },
  console: {
    ariaLabel: "Suche und Filter",
    searchPlaceholder: "Ort, Stadtteil oder Postleitzahl",
    searchAriaLabel: "Objekte nach Ort durchsuchen",
    searchClearLabel: "Suche leeren",
    examplePrefix: "z. B.",
    examples: ["Freiburg", "Rieselfeld", "3 Zimmer", "Haustiere erlaubt"],
    onlyMatching: "Nur passende Objekte",
    onlyMatchingHint:
      "Zeigt nur Objekte, deren Anforderungen zu deinem Bewerbungsprofil passen.",
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
    customAmount: "Eigener Betrag",
    customValue: "Eigener Wert",
    customRentAria: "Maximale Kaltmiete in Euro",
    customAreaAria: "Minimale Wohnfläche in Quadratmetern",
    euroSuffix: "€",
    areaSuffix: "m²",
  },
  results: {
    count: (count: number) =>
      count === 1 ? "1 Objekt gefunden" : `${count} Objekte gefunden`,
    sortTriggerLabel: "Sortieren:",
    sortMenuAriaLabel: "Sortierung wählen",
    loadMore: "Mehr Objekte anzeigen",
    gridAriaLabel: "Gefundene Objekte",
  },
  card: {
    badgeNew: "Neu",
    badgeMatch: "Passt",
    badgeNoMatch: "Passt nicht",
    badgeApplied: "Bereits beworben",
    badgeNotSelected: "Nicht ausgewählt",
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
} as const;
