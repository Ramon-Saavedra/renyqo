import { MAX_ACTIVE_APPLICATIONS, type DashboardObjectStatus } from "../types";
import { STATUS_META } from "@/features/provider/listings-overview/copy/listings";

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
  published: STATUS_META.published.label,
  draft: STATUS_META.draft.label,
  paused: STATUS_META.paused.label,
  archived: STATUS_META.archived.label,
};

export const OBJECT_STATUS_SHORT_LABEL: Record<DashboardObjectStatus, string> =
  {
    published: "Aktiv",
    draft: "Entwurf",
    paused: "Pausiert",
    archived: "Archiv",
  };

export const dashboardCopy = {
  loading: "Dashboard wird vorbereitet …",
  error:
    "Dashboard konnte nicht geladen werden. Bitte versuche es gleich erneut.",
  fullError: {
    eyebrow: "Verbindungsfehler",
    title: "Ihre Objekte konnten nicht geladen werden",
    body: "Es gehen keine Daten verloren. Bitte versuche es erneut.",
    retry: "Erneut versuchen",
  },
  profile: {
    name: "Sabine Kessler",
    company: "Kessler Immobilien GbR",
    initials: "SK",
    settings: "Konto & Profil",
    logoutError: "Abmeldung fehlgeschlagen. Bitte versuche es erneut.",
  },
  topbar: {
    searchPlaceholder: "Objekt suchen…",
    searchAria: "Objekte durchsuchen",
    searchClear: "Suche leeren",
    objects: "Meine Objekte",
    objectsHref: "/provider/listings",
    newListing: "Neues Mietobjekt",
    newListingHref: "/provider/listings/new",
  },
  sidebar: {
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
  matrix: {
    heading: "Meine Objekte",
    statsLine: (
      total: number,
      published: number,
      drafts: number,
      activeApplications: number,
    ) =>
      `${total} Objekte · ${published} veröffentlicht · ${drafts} Entwürfe · ${activeApplications} aktive Bewerbungen`,
    allObjects: "Alle Objekte",
    noMatch: (query: string) => `Kein Objekt gefunden für „${query}".`,
    previewAction: (short: string) => `Vorschau zu ${short}`,
    selectAction: "Auswählen",
    openListing: "Objekt öffnen",
    cellAria: (
      short: string,
      status: string,
      active: number,
      selected: boolean,
    ) =>
      selected
        ? `${short}, ${status}, ${active} von ${MAX_ACTIVE_APPLICATIONS} aktiven Bewerbungen, aktuell ausgewählt`
        : `${short}, ${status}, ${active} von ${MAX_ACTIVE_APPLICATIONS} aktiven Bewerbungen — als aktuelles Objekt auswählen`,
  },
  attention: {
    openQuestions: (count: number) =>
      count === 1 ? "1 offene Bewerberfrage" : `${count} offene Bewerberfragen`,
  },
  preview: {
    close: "Schließen",
  },
  object: {
    sectionHeading: "Ausgewähltes Objekt",
    emptyTitle: "Noch keine Mietobjekte",
    emptyAddress: "Lege ein Mietobjekt an, um Details zu sehen.",
    edit: "Bearbeiten",
    preview: "Vorschau",
    share: "Teilen",
    publishedCaption: "Veröffentlicht am",
    updatedCaption: "Zuletzt bearbeitet am",
    livingArea: "Wohnfläche",
    rooms: "Zimmer",
    coldRent: "Kaltmiete",
    availableFrom: "Frei ab",
    availableFromEmpty: "Offen",
  },
  candidates: {
    title: "Aktive Bewerber",
    lead: `Nur passende Bewerbungen werden aktiv angezeigt — höchstens ${MAX_ACTIVE_APPLICATIONS} pro Objekt.`,
    slotLabel: (active: number, capacity: number) =>
      `${active} / ${capacity} aktiv`,
    draftEmpty:
      "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
    noApplicants:
      "Noch keine Bewerbungen. Teile den Objektlink, damit die ersten Anfragen eingehen.",
    loadError:
      "Bewerbungen konnten nicht geladen werden. Bitte versuche es gleich erneut.",
    reloadAction: "Bewerber neu laden",
    householdOne: "1 Person",
    householdMany: (count: number) => `${count} Personen`,
    householdUnavailable: "Haushalt nicht angegeben",
    previewAction: (
      name: string,
      household: string,
      warningLabels: readonly string[],
    ) =>
      `Bewerbung von ${name}, ${household}${warningLabels.length ? `, ${warningLabels.join(", ")}` : ""}, öffnen`,
    rejectAction: (name: string) => `${name} ablehnen`,
    rejectTitle: "Bewerber ablehnen?",
    rejectText: (name: string) =>
      `Möchtest du die Bewerbung von ${name} wirklich ablehnen?`,
    rejectCancel: "Behalten",
    rejectConfirm: "Ablehnen",
    rejectPending: "Wird abgelehnt…",
    rejectError:
      "Die Bewerbung konnte nicht abgelehnt werden. Bitte versuche es erneut.",
    rejectSuccess: "Bewerbung wurde abgelehnt.",
  },
  waitingQueue: {
    badge: (count: number) => (count === 1 ? "+1 wartet" : `+${count} warten`),
    queueBadge: (count: number) => `+${count}`,
    queueLabel: "in Warteschlange",
    queuePosition: (position: number, total: number) =>
      `Nr. ${position} von ${total}`,
    queueTooltip: (count: number) =>
      `${count} Bewerber warten auf einen freien Platz.`,
    queueAria: (count: number, tierIndex: number) =>
      `Warteschlange: ${count} Bewerber warten auf einen freien Platz, Druckstufe ${tierIndex} von 6`,
    capacity: (max: number) => `Kapazität ${max}`,
    capacityWithQueue: (max: number) => `Kapazität ${max}`,
    loadError: "Warteschlange konnte nicht geladen werden.",
  },
  recentExits: {
    title: "Kürzlich ausgeschieden",
    helper:
      "Hier erscheinen nur Bewerber, die zuvor zu den 5 aktiven Bewerbungen gehört haben.",
    loadError:
      "Kürzlich ausgeschiedene Bewerbungen konnten nicht geladen werden.",
    reasonLabel: {
      withdrawn: "Zurückgezogen",
      provider_discarded: "Abgelehnt",
      system_removed: "Systemseitig entfernt",
    },
    viewLabel: "Profil ansehen",
    viewAction: (name: string) => `Profil ansehen — ${name}`,
    restoreLabel: "Wiederherstellen",
    restoreAction: (name: string) => `Wiederherstellen — ${name}`,
    restoreTitle: "Bewerber wieder aufnehmen?",
    restoreText: (name: string) =>
      `Möchtest du ${name} wieder in die Bewerbungen aufnehmen?`,
    restoreCancel: "Abbrechen",
    restoreConfirm: "Wieder aufnehmen",
    restorePending: "Wird wieder aufgenommen…",
    restoreError:
      "Die Bewerbung konnte nicht wieder aufgenommen werden. Bitte versuche es erneut.",
    restoreSuccess: "Bewerbung wurde wieder aufgenommen.",
  },
} as const;
